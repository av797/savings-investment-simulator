from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# ── Users ──

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    age: Optional[int] = None
    risk_profile: Optional[str] = None
    monthly_income: Optional[float] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str
    

class UserOut(BaseModel):
    id: int
    email: EmailStr
    age: Optional[int] = None
    risk_profile: Optional[str] = None
    monthly_income: Optional[float] = None
    created_at: Optional[datetime] = None
    is_active: bool

    model_config = {"from_attributes": True}


# ── Simulations ──

class SimulationInput(BaseModel):
    starting_balance: float
    monthly_contribution: float
    expected_return: float          # decimal e.g. 0.07 = 7%
    years: int
    inflation_rate: Optional[float] = 0.0  # decimal e.g. 0.02 = 2%


class SimulationSave(BaseModel):
    strategy_name: str
    starting_balance: float
    monthly_contribution: float
    expected_return: float
    years: int
    inflation_rate: Optional[float] = 0.0


class YearlyBreakdown(BaseModel):
    year: int
    balance: float
    real_balance: float             # inflation-adjusted
    total_contributions: float
    interest_earned: float


class SimulationOutputExtended(BaseModel):
    final_value: float
    real_final_value: float         # inflation-adjusted final value
    total_contributions: float
    interest_earned: float
    yearly_breakdown: List[YearlyBreakdown]


class SimulationOut(BaseModel):
    id: int
    strategy_name: str
    starting_balance: float
    monthly_contribution: float
    expected_return: float
    years: int
    inflation_rate: Optional[float] = None
    final_value: float
    score: Optional[int] = None
    created_at: datetime

    model_config = {"from_attributes": True}