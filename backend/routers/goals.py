from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from backend.db.database import get_db
from backend.db import models
from backend.schemas import (
    GoalCreate, GoalUpdate, GoalOut,
    GoalSplitsUpdate, GoalSplitOut,
)
from backend.dependencies import get_current_user

router = APIRouter(prefix="/goals", tags=["Goals"])


#Goals CRUD

@router.post("", response_model=GoalOut, status_code=status.HTTP_201_CREATED)
def create_goal(
    data: GoalCreate,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()

    if user.monthly_income and data.monthly_allocation > float(user.monthly_income):
        raise HTTPException(
            status_code=400,
            detail=f"Monthly allocation (£{data.monthly_allocation:,.0f}) cannot exceed your monthly income (£{float(user.monthly_income):,.0f})"
        )

    existing_goals = db.query(models.Goal).filter(
        models.Goal.user_id == user_id,
        models.Goal.status == "active"
    ).all()
    total_allocated = sum(float(g.monthly_allocation) for g in existing_goals)

    if user.monthly_income and (total_allocated + data.monthly_allocation) > float(user.monthly_income):
        remaining = float(user.monthly_income) - total_allocated
        raise HTTPException(
            status_code=400,
            detail=f"Total allocations would exceed your monthly income. You have £{remaining:,.0f} remaining to allocate."
        )

    goal = models.Goal(
        user_id=user_id,
        name=data.name,
        goal_type=data.goal_type,
        target_amount=data.target_amount,
        monthly_allocation=data.monthly_allocation,
        years=data.years,
        inflation_rate=data.inflation_rate,
        current_balance=data.current_balance,
        notes=data.notes,
    )
    db.add(goal)
    db.flush()

    if data.splits:
        _replace_splits(db, goal.id, data.splits)

    db.commit()
    db.refresh(goal)

    warning = None
    if user.monthly_income:
        all_goals = db.query(models.Goal).filter(
            models.Goal.user_id == user_id,
            models.Goal.status == "active"
        ).all()
        total = sum(float(g.monthly_allocation) for g in all_goals)
        pct   = (total / float(user.monthly_income)) * 100
        if pct > 50:
            goal.warning = (
                f"Heads up — your goals now use {pct:.0f}% of your monthly income "
                f"(£{total:,.0f}/month of £{float(user.monthly_income):,.0f}). "
                f"Make sure you have enough left for living costs."
            )

    return goal


@router.get("", response_model=List[GoalOut])
def list_goals(
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    
    return (
        db.query(models.Goal)
        .filter(models.Goal.user_id == user_id)
        .order_by(models.Goal.created_at.desc())
        .all()
    )


@router.get("/{goal_id}", response_model=GoalOut)
def get_goal(
    goal_id: int,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _get_goal_or_404(db, goal_id, user_id)


@router.patch("/{goal_id}", response_model=GoalOut)
def update_goal(
    goal_id: int,
    data: GoalUpdate,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    goal = _get_goal_or_404(db, goal_id, user_id)
    user = db.query(models.User).filter(models.User.id == user_id).first()

    
    if data.monthly_allocation is not None and user.monthly_income:
        other_goals = db.query(models.Goal).filter(
            models.Goal.user_id == user_id,
            models.Goal.status == "active",
            models.Goal.id != goal_id,
        ).all()
        total_other = sum(float(g.monthly_allocation) for g in other_goals)

        if (total_other + data.monthly_allocation) > float(user.monthly_income):
            remaining = float(user.monthly_income) - total_other
            raise HTTPException(
                status_code=400,
                detail=f"Monthly allocation would exceed your income. You have £{remaining:,.0f} available."
            )

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(goal, field, value)

    db.commit()
    db.refresh(goal)
    return goal


@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_goal(
    goal_id: int,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    goal = _get_goal_or_404(db, goal_id, user_id)
    db.delete(goal)
    db.commit()


#Splits

@router.put("/{goal_id}/splits", response_model=List[GoalSplitOut])
def set_splits(
    goal_id: int,
    data: GoalSplitsUpdate,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    goal = _get_goal_or_404(db, goal_id, user_id)
    splits = _replace_splits(db, goal.id, data.splits)
    db.commit()
    return splits


@router.get("/{goal_id}/splits", response_model=List[GoalSplitOut])
def get_splits(
    goal_id: int,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _get_goal_or_404(db, goal_id, user_id)
    return (
        db.query(models.GoalSplit)
        .filter(models.GoalSplit.goal_id == goal_id)
        .all()
    )


#ML split suggestion

@router.post("/{goal_id}/suggest-split")
def suggest_split(
    goal_id: int,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    
    from backend.simulations.ml_models import suggest_split as ml_suggest
    from backend.simulations.market_data import get_historical_returns

    goal = _get_goal_or_404(db, goal_id, user_id)
    user = db.query(models.User).filter(models.User.id == user_id).first()

    historical_returns = get_historical_returns(db)

    result = ml_suggest(
        age=user.age,
        monthly_income=float(user.monthly_income) if user.monthly_income else None,
        goal_type=goal.goal_type,
        years=goal.years,
        target_amount=float(goal.target_amount),
        risk_profile=user.risk_profile,
        historical_returns=historical_returns,
    )

    return result


#Helpers

def _get_goal_or_404(db: Session, goal_id: int, user_id: int) -> models.Goal:
    goal = (
        db.query(models.Goal)
        .filter(models.Goal.id == goal_id, models.Goal.user_id == user_id)
        .first()
    )
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    return goal


def _replace_splits(db: Session, goal_id: int, splits_data) -> list:
    db.query(models.GoalSplit).filter(models.GoalSplit.goal_id == goal_id).delete()
    new_splits = []
    for s in splits_data:
        split = models.GoalSplit(
            goal_id=goal_id,
            asset_class=s.asset_class,
            percentage=s.percentage,
            expected_return_override=s.expected_return_override,
        )
        db.add(split)
        new_splits.append(split)
    db.flush()
    return new_splits