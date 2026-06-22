import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from typing import List, Optional
from groq import Groq

from backend.db.database import get_db
from backend.db import models
from backend.dependencies import get_current_user

router = APIRouter(prefix="/chat", tags=["Chat"])


class ChatMessage(BaseModel):
    role: str 
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    page_context: Optional[str] = None


def _get_user_context(user_id: int, db: Session) -> str:
    """Build a rich context string from the user's goals and simulations."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        return ""

    lines = []
    lines.append(f"USER PROFILE:")
    lines.append(f"- Age: {user.age or 'not set'}")
    lines.append(f"- Monthly income: £{float(user.monthly_income):,.0f}" if user.monthly_income else "- Monthly income: not set")
    lines.append(f"- Risk profile: {user.risk_profile or 'not set'}")

    goals = (
        db.query(models.Goal)
        .filter(models.Goal.user_id == user_id, models.Goal.status == "active")
        .all()
    )

    if goals:
        lines.append(f"\nACTIVE GOALS ({len(goals)} total):")
        total_monthly = sum(float(g.monthly_allocation) for g in goals)
        lines.append(f"- Total monthly allocation: £{total_monthly:,.0f}")

        for goal in goals:
            lines.append(f"\n  Goal: {goal.name} ({goal.goal_type})")
            lines.append(f"  - Target: £{float(goal.target_amount):,.0f}")
            lines.append(f"  - Current balance: £{float(goal.current_balance):,.0f}")
            lines.append(f"  - Monthly: £{float(goal.monthly_allocation):,.0f}")
            lines.append(f"  - Timeline: {goal.years} years")
            lines.append(f"  - Inflation rate: {float(goal.inflation_rate) * 100:.1f}%")
            progress = (float(goal.current_balance) / float(goal.target_amount) * 100) if float(goal.target_amount) > 0 else 0
            lines.append(f"  - Progress: {progress:.1f}%")

            latest_sim = (
                db.query(models.Simulation)
                .filter(models.Simulation.goal_id == goal.id)
                .order_by(models.Simulation.run_at.desc())
                .first()
            )
            if latest_sim:
                lines.append(f"  - Latest simulation success rate: {float(latest_sim.success_rate):.1f}%")
                lines.append(f"  - Median outcome: £{float(latest_sim.median_outcome):,.0f}")
                lines.append(f"  - Worst 10%: £{float(latest_sim.worst_10pct):,.0f}")
                lines.append(f"  - Best 10%: £{float(latest_sim.best_10pct):,.0f}")
            else:
                lines.append(f"  - No simulation run yet")

            splits = (
                db.query(models.GoalSplit)
                .filter(models.GoalSplit.goal_id == goal.id)
                .all()
            )
            if splits:
                split_str = ", ".join(f"{s.asset_class} {float(s.percentage):.0f}%" for s in splits)
                lines.append(f"  - Asset allocation: {split_str}")
    else:
        lines.append("\nNo active goals yet.")

    return "\n".join(lines)


def _get_market_context(db: Session) -> str:
    """Pull key market stats from the market_returns table."""
    try:
        rows = db.execute(text("""
            SELECT
                asset_class,
                ROUND(AVG(return_pct)::numeric, 2) AS mean_return,
                ROUND(STDDEV(return_pct)::numeric, 2) AS volatility,
                ROUND(MAX(return_pct)::numeric, 2) AS best_year,
                ROUND(MIN(return_pct)::numeric, 2) AS worst_year,
                COUNT(*) AS years
            FROM market_returns
            GROUP BY asset_class
            ORDER BY asset_class
        """)).fetchall()

        if not rows:
            return ""

        lines = ["\nMARKET DATA (30-year historical, from your database):"]
        for row in rows:
            lines.append(
                f"- {row[0]}: avg {row[1]}%/yr, volatility {row[2]}%, "
                f"best year {row[3]}%, worst year {row[4]}%, {row[5]} years of data"
            )

        return "\n".join(lines)
    except Exception:
        return ""


def _build_system_prompt(user_context: str, market_context: str, page_context: Optional[str]) -> str:
    page_note = f"\nThe user is currently on the {page_context} page." if page_context else ""

    return f"""You are GoalIQ's financial assistant — a friendly, knowledgeable AI that helps users understand their financial goals and market data.

You have access to the user's real data:{page_note}

{user_context}
{market_context}

RULES:
- Always reference the user's actual data when answering questions about their goals
- Be concise — 2-4 sentences unless the question needs more detail
- Be friendly and encouraging, not clinical
- Never recommend specific stocks or funds beyond what's already in their plan
- Always clarify this is not regulated financial advice when giving specific suggestions
- If asked about market history, use the data above — don't guess
- If you don't know something, say so honestly
- Use £ for currency since this is a UK-focused app
- When success rates are below 75%, gently flag it and suggest they use the AI Analysis feature on the goal page
- Keep responses conversational — this is a chat, not a report

You are NOT a general purpose assistant. Stay focused on personal finance, the user's goals, and market data. If asked about unrelated topics, politely redirect."""


@router.post("")
def chat(
    request: ChatRequest,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="Chat is not configured")

    user_context   = _get_user_context(user_id, db)
    market_context = _get_market_context(db)
    system_prompt  = _build_system_prompt(user_context, market_context, request.page_context)

    messages = [{"role": "system", "content": system_prompt}]
    for msg in request.messages[-10:]:
        messages.append({"role": msg.role, "content": msg.content})

    try:
        client   = Groq(api_key=api_key)
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            max_tokens=300,
            temperature=0.6,
        )
        reply = response.choices[0].message.content.strip()
        return {"reply": reply}
    except Exception as e:
        print(f"GROQ ERROR: {str(e)}") 
        raise HTTPException(status_code=503, detail="Chat service unavailable")