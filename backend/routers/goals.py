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


# =============================================================================
# Goals CRUD
# =============================================================================

@router.post("", response_model=GoalOut, status_code=status.HTTP_201_CREATED)
def create_goal(
    data: GoalCreate,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create a new goal for the current user.
    Optionally include splits in the same request.
    """
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
    db.flush()  # get goal.id without committing

    # If splits were provided at creation time, insert them now
    if data.splits:
        _replace_splits(db, goal.id, data.splits)

    db.commit()
    db.refresh(goal)
    return goal


@router.get("", response_model=List[GoalOut])
def list_goals(
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return all active goals for the current user, newest first."""
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
    """Return a single goal with its splits."""
    goal = _get_goal_or_404(db, goal_id, user_id)
    return goal


@router.patch("/{goal_id}", response_model=GoalOut)
def update_goal(
    goal_id: int,
    data: GoalUpdate,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Partially update a goal. Only provided fields are changed.
    updated_at is handled automatically by the DB trigger.
    """
    goal = _get_goal_or_404(db, goal_id, user_id)

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
    """
    Delete a goal. Cascades to goal_splits, simulations,
    and simulation_yearly_breakdown automatically via DB constraints.
    """
    goal = _get_goal_or_404(db, goal_id, user_id)
    db.delete(goal)
    db.commit()


# =============================================================================
# Splits
# =============================================================================

@router.put("/{goal_id}/splits", response_model=List[GoalSplitOut])
def set_splits(
    goal_id: int,
    data: GoalSplitsUpdate,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Replace all splits for a goal.
    Deletes existing splits and inserts the new ones.
    Percentages must sum to 100 (validated in schema).
    """
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
    """Return all splits for a goal."""
    _get_goal_or_404(db, goal_id, user_id)
    return (
        db.query(models.GoalSplit)
        .filter(models.GoalSplit.goal_id == goal_id)
        .all()
    )


# =============================================================================
# Helpers
# =============================================================================

def _get_goal_or_404(db: Session, goal_id: int, user_id: int) -> models.Goal:
    """Fetch a goal, raising 404 if not found or not owned by the user."""
    goal = (
        db.query(models.Goal)
        .filter(models.Goal.id == goal_id, models.Goal.user_id == user_id)
        .first()
    )
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    return goal


def _replace_splits(db: Session, goal_id: int, splits_data) -> list:
    """Delete all existing splits for a goal and insert new ones."""
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