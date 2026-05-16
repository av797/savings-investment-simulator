import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from backend.db.database import get_db
from backend.db import models
from backend.schemas import SimulationOut, SimulationSummary, DashboardOut, GoalDashboardItem, GoalOut
from backend.dependencies import get_current_user
from backend.simulations.montecarlo import run_monte_carlo
from backend.simulations.market_data import get_historical_returns

router = APIRouter(tags=["Simulations"])


# ── Run a simulation ──

@router.post("/goals/{goal_id}/simulate", response_model=SimulationOut, status_code=status.HTTP_201_CREATED)
def simulate_goal(
    goal_id: int,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    goal = _get_goal_or_404(db, goal_id, user_id)

    splits = (
        db.query(models.GoalSplit)
        .filter(models.GoalSplit.goal_id == goal_id)
        .all()
    )

    if not splits:
        raise HTTPException(
            status_code=400,
            detail="Goal has no splits set. Add splits before simulating."
        )

    splits_dict = {
        s.asset_class: {
            "percentage": float(s.percentage),
            "expected_return_override": float(s.expected_return_override) if s.expected_return_override else None,
        }
        for s in splits
    }

    historical = get_historical_returns(db)
    historical_returns = historical if historical else None

    result = run_monte_carlo(
        starting_balance=float(goal.current_balance),
        monthly_contribution=float(goal.monthly_allocation),
        years=goal.years,
        inflation_rate=float(goal.inflation_rate),
        target_amount=float(goal.target_amount),
        splits=splits_dict,
        historical_returns=historical_returns,
    )

    snapshot_splits = json.dumps([
        {"asset_class": s.asset_class, "percentage": float(s.percentage)}
        for s in splits
    ])

    sim = models.Simulation(
        goal_id=goal_id,
        scenario_count=result["scenario_count"],
        success_rate=result["success_rate"],
        median_outcome=result["median_outcome"],
        worst_10pct=result["worst_10pct"],
        best_10pct=result["best_10pct"],
        snapshot_target_amount=float(goal.target_amount),
        snapshot_monthly_allocation=float(goal.monthly_allocation),
        snapshot_years=goal.years,
        snapshot_inflation_rate=float(goal.inflation_rate),
        snapshot_splits=snapshot_splits,
    )

    db.add(sim)
    db.flush()

    for year_data in result["yearly_breakdown"]:
        row = models.SimulationYearlyBreakdown(
            simulation_id=sim.id,
            year=year_data["year"],
            p10_balance=year_data["p10_balance"],
            median_balance=year_data["median_balance"],
            p90_balance=year_data["p90_balance"],
            contributions=year_data["contributions"],
        )
        db.add(row)

    db.commit()
    db.refresh(sim)
    return sim


# ── Simulation history ──

@router.get("/goals/{goal_id}/simulations", response_model=List[SimulationSummary])
def get_simulation_history(
    goal_id: int,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    _get_goal_or_404(db, goal_id, user_id)

    return (
        db.query(models.Simulation)
        .filter(models.Simulation.goal_id == goal_id)
        .order_by(models.Simulation.run_at.desc())
        .all()
    )


@router.get("/simulations/{simulation_id}", response_model=SimulationOut)
def get_simulation(
    simulation_id: int,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    
    sim = db.query(models.Simulation).filter(models.Simulation.id == simulation_id).first()
    if not sim:
        raise HTTPException(status_code=404, detail="Simulation not found")

    _get_goal_or_404(db, sim.goal_id, user_id)
    return sim


# ── Dashboard ──

@router.get("/dashboard", response_model=DashboardOut)
def get_dashboard(
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    
    goals = (
        db.query(models.Goal)
        .filter(models.Goal.user_id == user_id)
        .order_by(models.Goal.created_at.desc())
        .all()
    )

    goal_items = []
    total_monthly = 0.0
    total_target = 0.0
    total_balance = 0.0
    weighted_success = 0.0
    total_allocation_with_sim = 0.0
    weakest_goal_id = None
    weakest_success = None

    for goal in goals:
        latest_sim = (
            db.query(models.Simulation)
            .filter(models.Simulation.goal_id == goal.id)
            .order_by(models.Simulation.run_at.desc())
            .first()
        )

        target     = float(goal.target_amount)
        balance    = float(goal.current_balance)
        allocation = float(goal.monthly_allocation)

        progress_pct = round((balance / target * 100), 2) if target > 0 else 0.0

        total_monthly += allocation
        total_target  += target
        total_balance += balance

        if latest_sim:
            weighted_success          += float(latest_sim.success_rate) * allocation
            total_allocation_with_sim += allocation

            if weakest_success is None or float(latest_sim.success_rate) < weakest_success:
                weakest_success = float(latest_sim.success_rate)
                weakest_goal_id = goal.id

        goal_items.append(
            GoalDashboardItem(
                goal=GoalOut.model_validate(goal),
                latest_simulation=SimulationSummary.model_validate(latest_sim) if latest_sim else None,
                progress_pct=progress_pct,
            )
        )

    overall_confidence = None
    if total_allocation_with_sim > 0:
        overall_confidence = round(weighted_success / total_allocation_with_sim, 1)

    return DashboardOut(
        goals=goal_items,
        total_monthly_allocation=round(total_monthly, 2),
        overall_confidence=overall_confidence,
        weakest_goal_id=weakest_goal_id,
        total_target=round(total_target, 2),
        total_current_balance=round(total_balance, 2),
    )


# ── Helper ──

def _get_goal_or_404(db: Session, goal_id: int, user_id: int) -> models.Goal:
    goal = (
        db.query(models.Goal)
        .filter(models.Goal.id == goal_id, models.Goal.user_id == user_id)
        .first()
    )
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    return goal