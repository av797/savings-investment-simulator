import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from groq import Groq

from backend.db.database import get_db
from backend.db import models
from backend.dependencies import get_current_user
from backend.simulations.montecarlo import run_monte_carlo
from backend.simulations.market_data import get_historical_returns
from backend.simulations.ml_models import suggest_split, SPLIT_PROFILES

router = APIRouter(tags=["Analysis"])

GOAL_TYPE_LABELS = {
    "house":          "house deposit",
    "retirement":     "retirement fund",
    "emergency_fund": "emergency fund",
    "education":      "education fund",
    "travel":         "travel fund",
    "other":          "savings goal",
}


def _get_goal_or_404(db, goal_id, user_id):
    goal = (
        db.query(models.Goal)
        .filter(models.Goal.id == goal_id, models.Goal.user_id == user_id)
        .first()
    )
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    return goal


def _build_splits_dict(splits):
    return {
        s.asset_class: {
            "percentage": float(s.percentage),
            "expected_return_override": float(s.expected_return_override) if s.expected_return_override else None,
        }
        for s in splits
    }


def _run_quick_sim(goal, splits_dict, historical_returns, monthly_contribution=None):
    """Run a quick 2000-scenario simulation — fast enough for iterative improvement calc."""
    return run_monte_carlo(
        starting_balance=float(goal.current_balance),
        monthly_contribution=monthly_contribution or float(goal.monthly_allocation),
        years=goal.years,
        inflation_rate=float(goal.inflation_rate),
        target_amount=float(goal.target_amount),
        splits=splits_dict,
        scenario_count=2000,
        historical_returns=historical_returns,
    )


def _find_extra_contribution_needed(goal, splits_dict, historical_returns, current_rate):
    """
    Binary search for the minimum extra monthly contribution
    that pushes success rate above 75%.
    Returns (extra_amount, new_success_rate) or (None, current_rate) if already >= 75%.
    """
    if current_rate >= 75:
        return None, current_rate

    current_monthly = float(goal.monthly_allocation)
    low, high = 0, 2000 

    best_extra = None
    best_rate  = current_rate

    for _ in range(12):
        mid = (low + high) / 2
        result = _run_quick_sim(goal, splits_dict, historical_returns, current_monthly + mid)
        rate   = result["success_rate"]

        if rate >= 75:
            best_extra = mid
            best_rate  = rate
            high = mid
        else:
            low = mid

    if best_extra is None:
        result = _run_quick_sim(goal, splits_dict, historical_returns, current_monthly + 2000)
        return 2000, result["success_rate"]

    return round(best_extra, 0), round(best_rate, 1)


def _find_better_split(goal, user, historical_returns, current_rate):
    """
    Use the ML model to suggest a better split, simulate it,
    and return the suggestion if it improves success rate by > 5%.
    """
    suggestion = suggest_split(
        age=user.age,
        monthly_income=float(user.monthly_income) if user.monthly_income else None,
        goal_type=goal.goal_type,
        years=goal.years,
        target_amount=float(goal.target_amount),
        risk_profile=user.risk_profile,
        historical_returns=historical_returns,
    )

    suggested_profile = suggestion["profile"]
    suggested_splits  = suggestion["splits"]

    splits_dict = {
        asset: {"percentage": pct, "expected_return_override": None}
        for asset, pct in suggested_splits.items()
        if pct > 0
    }

    result   = _run_quick_sim(goal, splits_dict, historical_returns)
    new_rate = result["success_rate"]

    improvement = new_rate - current_rate
    return {
        "profile":     suggested_profile,
        "splits":      suggested_splits,
        "new_rate":    round(new_rate, 1),
        "improvement": round(improvement, 1),
        "reasoning":   suggestion["reasoning"],
    }


def _call_groq(prompt: str) -> str:
    """Call Groq API and return the generated text."""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return None

    try:
        client   = Groq(api_key=api_key)
        response = client.chat.completions.create(
            model="llama-3.1-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=200,
            temperature=0.5,
        )
        return response.choices[0].message.content.strip()
    except Exception:
        return None


def _build_prompt(goal, user, current_rate, extra_needed, new_rate_with_extra,
                  split_suggestion, goal_type_label):
    """Build the Groq prompt from pre-calculated numbers."""

    parts = [
        f"The user has a {goal_type_label} goal targeting £{float(goal.target_amount):,.0f} "
        f"in {goal.years} years, currently saving £{float(goal.monthly_allocation):,.0f}/month. "
        f"Their Monte Carlo success rate is {current_rate}%.",
    ]

    if extra_needed is not None:
        parts.append(
            f"Increasing their monthly contribution by £{extra_needed:,.0f} would raise "
            f"their success rate to approximately {new_rate_with_extra}%."
        )

    if split_suggestion and split_suggestion["improvement"] > 5:
        splits_readable = ", ".join(
            f"{pct}% {ac}" for ac, pct in split_suggestion["splits"].items() if pct > 0
        )
        parts.append(
            f"Switching to a {split_suggestion['profile'].replace('_', ' ')} allocation "
            f"({splits_readable}) would improve their success rate by "
            f"approximately {split_suggestion['improvement']}% based on 30 years of real market data."
        )

    parts.append(
        "Write a concise, friendly 2-3 sentence suggestion explaining what they should do and why. "
        "Be specific with the numbers. Do not use jargon. Do not mention Monte Carlo or algorithms. "
        "Sound like a knowledgeable friend giving honest advice. Do not start with 'I'."
    )

    return " ".join(parts)


@router.post("/goals/{goal_id}/analyse")
def analyse_goal(
    goal_id: int,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Analyses a goal and returns:
    - current success rate
    - extra monthly contribution needed to hit 75%
    - better split suggestion from ML model
    - AI-generated natural language suggestion from Groq
    """
    goal = _get_goal_or_404(db, goal_id, user_id)
    user = db.query(models.User).filter(models.User.id == user_id).first()

    splits = (
        db.query(models.GoalSplit)
        .filter(models.GoalSplit.goal_id == goal_id)
        .all()
    )

    if not splits:
        raise HTTPException(
            status_code=400,
            detail="Set asset splits before running analysis."
        )

    historical_returns = get_historical_returns(db)
    splits_dict        = _build_splits_dict(splits)

    current_sim  = _run_quick_sim(goal, splits_dict, historical_returns)
    current_rate = current_sim["success_rate"]

    extra_needed, new_rate_with_extra = _find_extra_contribution_needed(
        goal, splits_dict, historical_returns, current_rate
    )

    split_suggestion = _find_better_split(goal, user, historical_returns, current_rate)

    goal_type_label = GOAL_TYPE_LABELS.get(goal.goal_type, "savings goal")

    ai_suggestion = None
    if current_rate < 75:
        prompt        = _build_prompt(
            goal, user, current_rate, extra_needed, new_rate_with_extra,
            split_suggestion, goal_type_label
        )
        ai_suggestion = _call_groq(prompt)

    return {
        "current_rate":         current_rate,
        "target_rate":          75,
        "on_track":             current_rate >= 75,
        "extra_monthly_needed": extra_needed,
        "rate_with_extra":      new_rate_with_extra,
        "split_suggestion":     split_suggestion if split_suggestion["improvement"] > 5 else None,
        "ai_suggestion":        ai_suggestion,
        "median_outcome":       current_sim["median_outcome"],
        "worst_10pct":          current_sim["worst_10pct"],
    }