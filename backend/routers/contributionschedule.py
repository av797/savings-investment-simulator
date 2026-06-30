from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text

from backend.db.database import get_db
from backend.db import models
from backend.dependencies import get_current_user

router = APIRouter(tags=["Contribution Schedule"])


def _get_median_annual_return(db: Session, splits: list) -> float:
    FALLBACK = {
        "cash":   0.025,
        "bonds":  0.040,
        "stocks": 0.070,
        "etfs":   0.065,
    }

    rows = db.execute(text("""
        SELECT asset_class, AVG(return_pct) as mean_return
        FROM market_returns
        GROUP BY asset_class
    """)).fetchall()

    db_returns = {row[0]: float(row[1]) / 100 for row in rows}

    blended = 0.0
    for split in splits:
        asset   = split.asset_class
        weight  = float(split.percentage) / 100
        returns = db_returns.get(asset, FALLBACK.get(asset, 0.05))

        if split.expected_return_override:
            returns = float(split.expected_return_override)

        blended += weight * returns

    return blended


def _required_monthly(current_balance: float, target: float, annual_return: float, years_remaining: int) -> float:
    if years_remaining <= 0:
        return 0.0

    r = annual_return / 12
    n = years_remaining * 12

    fv_balance = current_balance * ((1 + r) ** n)
    remaining  = target - fv_balance

    if remaining <= 0:
        return 0.0 

    if r == 0:
        return remaining / n

    # Solve for PMT: remaining = PMT * (((1+r)^n - 1) / r)
    pmt = remaining / (((1 + r) ** n - 1) / r)
    return max(0.0, pmt)


@router.get("/goals/{goal_id}/contribution-schedule")
def get_contribution_schedule(
    goal_id: int,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    goal = (
        db.query(models.Goal)
        .filter(models.Goal.id == goal_id, models.Goal.user_id == user_id)
        .first()
    )
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    splits = (
        db.query(models.GoalSplit)
        .filter(models.GoalSplit.goal_id == goal_id)
        .all()
    )
    if not splits:
        raise HTTPException(status_code=400, detail="Goal has no splits configured")

    annual_return    = _get_median_annual_return(db, splits)
    current_monthly  = float(goal.monthly_allocation)
    current_balance  = float(goal.current_balance)
    target           = float(goal.target_amount)
    total_years      = goal.years
    inflation_rate   = float(goal.inflation_rate)

    schedule = []
    running_balance = current_balance

    for year in range(1, total_years + 1):
        years_remaining = total_years - year + 1
        required        = _required_monthly(running_balance, target, annual_return, years_remaining)

        gap    = required - current_monthly
        status = "on_track" if gap <= 0 else "underfunding" if gap <= 100 else "at_risk"

        real_target = target / ((1 + inflation_rate) ** year) if inflation_rate > 0 else target

        schedule.append({
            "year":             year,
            "calendar_year":    2025 + year - 1,
            "required_monthly": round(required, 2),
            "current_monthly":  round(current_monthly, 2),
            "gap":              round(gap, 2),
            "status":           status,
            "projected_balance": round(running_balance, 2),
            "target":           round(target, 2),
            "real_target":      round(real_target, 2),
        })

        monthly_rate = annual_return / 12
        for _ in range(12):
            running_balance = running_balance * (1 + monthly_rate) + current_monthly

    return {
        "goal_id":        goal_id,
        "goal_name":      goal.name,
        "target":         target,
        "total_years":    total_years,
        "annual_return":  round(annual_return * 100, 2),
        "current_monthly": current_monthly,
        "schedule":       schedule,
    }