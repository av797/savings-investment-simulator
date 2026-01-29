#Here to validate inputs to POST & PATCH

from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    age: Optional[int] = None
    risk_profile: Optional[str] = None
    monthly_income: Optional[float] = None

#defines what api returns to the user
class UserOut(BaseModel):
    id: int  # DB-generated primary key
    email: EmailStr  # user email
    age: Optional[int] = None  # optional age
    risk_profile: Optional[str] = None  # optional risk profile
    monthly_income: Optional[float] = None  # optional income
    created_at: Optional[datetime] = None  # timestamp when user was created
    is_active: Optional[int] = 1  # soft-delete flag (1 = active, 0 = deleted)

    class Config:
        orm_mode = True  # allows SQLAlchemy objects to be returned directly