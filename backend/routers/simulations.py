from fastapi import APIRouter
from backend.schemas import SimulationInput, SimulationOutput
from backend.simulations.simulation_math import run_simulation

router = APIRouter(prefix="/simulate", tags=["Simulations"])

# Simulation endpoint
@router.post("/simulate", response_model=SimulationOutput)
def simulate(data: SimulationInput):
    final_value, total_contributions, interest_earned = run_simulation(
        starting_balance=data.starting_balance,
        monthly_contribution=data.monthly_contribution,
        expected_return=data.expected_return,
        years=data.years
    )

    return {
        "final_value": round(final_value, 2),
        "total_contributions": round(total_contributions, 2),
        "interest_earned": round(interest_earned, 2)
    }