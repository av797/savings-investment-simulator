#Here to validate inputs to POST & PATCH

from pydantic import BaseModel, EmailStr
from typing import Optional

class UserCreate(BaseModel):
    email: EmailStr
    age: Optional[int] = None
    risk_profile: Optional[str] = None
    monthly_income: Optional[float] = None