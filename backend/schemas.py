#Here to validate inputs to POST & PATCH

from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    age: Optional[int] = None
    risk_profile: Optional[str] = None
    monthly_income: Optional[float] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

#defines what api returns to the user
class UserOut(BaseModel):
    id: int  # DB-generated primary key
    email: EmailStr  # user email
    age: Optional[int] = None  # optional age
    risk_profile: Optional[str] = None  # optional risk profile
    monthly_income: Optional[float] = None  # optional income
    created_at: Optional[datetime] = None  # timestamp when user was created
    is_active: bool  # soft-delete flag (1 = active, 0 = deleted)
    
    model_config = {
        "from_attributes": True  # Pydantic v2 replacement for orm_mode
    }


#for simulations
class SimulationInput(BaseModel):
    strategy_name: str
    starting_balance: float
    monthly_contribution: float
    expected_return: float  # annual %
    years: int


class SimulationOutput(BaseModel):
    final_value: float
    total_contributions: float
    interest_earned: float