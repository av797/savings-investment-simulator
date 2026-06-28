from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from backend.db.database import get_db
from backend.db import models
from backend.dependencies import get_current_user
from backend.simulations.montecarlo import run_monte_carlo
from backend.simulations.market_data import get_historical_returns

router = APIRouter(tags=["What-If"])


class WhatIfRequest(BaseModel):
    extra_monthly: float = 0.0
    extra_years: int = 0


@router.post("/goals/{goal_id}/whatif")
def whatif_simulation(
    goal_id: int,
    body: WhatIfRequest,
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

    splits_dict = {
        s.asset_class: {
            "percentage": float(s.percentage),
            "expected_return_override": float(s.expected_return_override) if s.expected_return_override else None,
        }
        for s in splits
    }

    monthly = float(goal.monthly_allocation) + body.extra_monthly
    years   = goal.years + body.extra_years

    if monthly <= 0:
        raise HTTPException(status_code=400, detail="Monthly contribution must be greater than 0")
    if years <= 0:
        raise HTTPException(status_code=400, detail="Time horizon must be at least 1 year")

    historical_returns = get_historical_returns(db)

    result = run_monte_carlo(
        starting_balance=float(goal.current_balance),
        monthly_contribution=monthly,
        years=years,
        inflation_rate=float(goal.inflation_rate),
        target_amount=float(goal.target_amount),
        splits=splits_dict,
        scenario_count=2000,
        historical_returns=historical_returns if historical_returns else None,
    )

    return {
        "median_outcome": result["median_outcome"],
        "worst_10pct":    result["worst_10pct"],
        "best_10pct":     result["best_10pct"],
        "success_rate":   result["success_rate"],
        "yearly_breakdown": [
            {
                "year":    y["year"],
                "p10":     y["p10_balance"],
                "median":  y["median_balance"],
                "p90":     y["p90_balance"],
                "contributions": y["contributions"],
            }
            for y in result["yearly_breakdown"]
        ],
        "monthly_used": monthly,
        "years_used":   years,
    }