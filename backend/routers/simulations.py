from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from backend.db.database import get_db
from backend.db import models
from backend.schemas import SimulationInput, SimulationOutput, SimulationSave, SimulationOut, SimulationOutputExtended
from backend.simulations.simulation_math import run_simulation, run_simulation_yearly
from backend.dependencies import get_current_user

router = APIRouter(prefix="/simulate", tags=["Simulations"])


# Run simulation (public, no save)
@router.post("/simulate", response_model=SimulationOutputExtended)
def simulate(data: SimulationInput):
    final_value, total_contributions, interest_earned = run_simulation(
        starting_balance=data.starting_balance,
        monthly_contribution=data.monthly_contribution,
        expected_return=data.expected_return,
        years=data.years
    )

    yearly_breakdown = run_simulation_yearly(
        starting_balance=data.starting_balance,
        monthly_contribution=data.monthly_contribution,
        expected_return=data.expected_return,
        years=data.years
    )

    return {
        "final_value": round(final_value, 2),
        "total_contributions": round(total_contributions, 2),
        "interest_earned": round(interest_earned, 2),
        "yearly_breakdown": yearly_breakdown,
    }


# Save a simulation (protected)
@router.post("/save", response_model=SimulationOut, status_code=201)
def save_simulation(
    data: SimulationSave,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    final_value, _, _ = run_simulation(
        starting_balance=data.starting_balance,
        monthly_contribution=data.monthly_contribution,
        expected_return=data.expected_return,
        years=data.years
    )

    sim = models.Simulation(
        user_id=user_id,
        strategy_name=data.strategy_name,
        starting_balance=data.starting_balance,
        monthly_contribution=data.monthly_contribution,
        expected_return=data.expected_return,
        final_value=round(final_value, 2),
    )

    db.add(sim)
    db.commit()
    db.refresh(sim)
    return sim


# Get all simulations for current user (protected)
@router.get("/me", response_model=List[SimulationOut])
def get_my_simulations(
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    simulations = db.query(models.Simulation).filter(
        models.Simulation.user_id == user_id
    ).order_by(models.Simulation.created_at.desc()).all()

    return simulations


# Delete a simulation (protected, checks ownership)
@router.delete("/{simulation_id}", status_code=204)
def delete_simulation(
    simulation_id: int,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sim = db.query(models.Simulation).filter(
        models.Simulation.id == simulation_id,
        models.Simulation.user_id == user_id  # ownership check
    ).first()

    if not sim:
        raise HTTPException(status_code=404, detail="Simulation not found")

    db.delete(sim)
    db.commit()
    return