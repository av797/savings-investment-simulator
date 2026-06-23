from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime


#Users

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    age: int
    risk_profile: Optional[str] = None
    monthly_income: Optional[float] = None

    @field_validator("age")
    @classmethod
    def validate_age(cls, v):
        if v is not None and v < 18:
            raise ValueError("You must be 18 or older to create an account")
        return v


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
    avatar: Optional[str] = None

    model_config = {"from_attributes": True}

class UserUpdate(BaseModel):
    age: Optional[int] = None
    risk_profile: Optional[str] = None
    monthly_income: Optional[float] = None
    avatar: Optional[str] = None


#Goal Splits

VALID_ASSET_CLASSES = {"cash", "bonds", "stocks", "etfs"}

class GoalSplitIn(BaseModel):
    asset_class: str                                  
    percentage: float                                 
    expected_return_override: Optional[float] = None

    @field_validator("asset_class")
    @classmethod
    def validate_asset_class(cls, v):
        if v not in VALID_ASSET_CLASSES:
            raise ValueError(f"asset_class must be one of {VALID_ASSET_CLASSES}")
        return v

    @field_validator("percentage")
    @classmethod
    def validate_percentage(cls, v):
        if not (0 < v <= 100):
            raise ValueError("percentage must be between 0 and 100")
        return v


class GoalSplitOut(BaseModel):
    id: int
    goal_id: int
    asset_class: str
    percentage: float
    expected_return_override: Optional[float] = None

    model_config = {"from_attributes": True}


class GoalSplitsUpdate(BaseModel):
    splits: List[GoalSplitIn] 

    @field_validator("splits")
    @classmethod
    def validate_splits_sum(cls, v):
        if not v:
            raise ValueError("At least one split is required")
        total = sum(s.percentage for s in v)
        if abs(total - 100.0) > 0.01:
            raise ValueError(f"Split percentages must sum to 100, got {total}")
        asset_classes = [s.asset_class for s in v]
        if len(asset_classes) != len(set(asset_classes)):
            raise ValueError("Duplicate asset classes are not allowed")
        return v


#Goals

VALID_GOAL_TYPES = {"house", "retirement", "emergency_fund", "education", "travel", "other"}
VALID_STATUSES   = {"active", "completed", "paused"}


class GoalCreate(BaseModel):
    name: str
    goal_type: str = "other"                 
    target_amount: float
    monthly_allocation: float
    years: int
    inflation_rate: float = 0.0
    current_balance: float = 0.0
    notes: Optional[str] = None
    splits: Optional[List[GoalSplitIn]] = None     

    @field_validator("goal_type")
    @classmethod
    def validate_goal_type(cls, v):
        if v not in VALID_GOAL_TYPES:
            raise ValueError(f"goal_type must be one of {VALID_GOAL_TYPES}")
        return v

    @field_validator("target_amount")
    @classmethod
    def validate_target(cls, v):
        if v <= 0:
            raise ValueError("target_amount must be greater than 0")
        return v

    @field_validator("monthly_allocation")
    @classmethod
    def validate_allocation(cls, v):
        if v <= 0:
            raise ValueError("monthly_allocation must be greater than 0")
        return v

    @field_validator("years")
    @classmethod
    def validate_years(cls, v):
        if v <= 0:
            raise ValueError("years must be greater than 0")
        return v


class GoalUpdate(BaseModel):
    name: Optional[str] = None                      
    goal_type: Optional[str] = None
    target_amount: Optional[float] = None
    monthly_allocation: Optional[float] = None
    years: Optional[int] = None
    inflation_rate: Optional[float] = None
    current_balance: Optional[float] = None
    status: Optional[str] = None
    notes: Optional[str] = None

    @field_validator("goal_type")
    @classmethod
    def validate_goal_type(cls, v):
        if v is not None and v not in VALID_GOAL_TYPES:
            raise ValueError(f"goal_type must be one of {VALID_GOAL_TYPES}")
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v):
        if v is not None and v not in VALID_STATUSES:
            raise ValueError(f"status must be one of {VALID_STATUSES}")
        return v


class GoalOut(BaseModel):
    id: int
    user_id: int
    name: str
    goal_type: str
    target_amount: float
    monthly_allocation: float
    years: int
    inflation_rate: float
    current_balance: float
    status: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    splits: List[GoalSplitOut] = []          
    warning: Optional[str] = None

    model_config = {"from_attributes": True}


#Simulations

class SimulationYearlyBreakdownOut(BaseModel):
    year: int
    p10_balance: float                                
    median_balance: float                             
    p90_balance: float                                
    contributions: float                              

    model_config = {"from_attributes": True}


class SimulationOut(BaseModel):
    id: int
    goal_id: int
    run_at: datetime
    scenario_count: int
    success_rate: float                               
    median_outcome: float                             
    worst_10pct: float                                
    best_10pct: float                                 
    snapshot_target_amount: float                     
    snapshot_monthly_allocation: float
    snapshot_years: int
    snapshot_inflation_rate: float
    snapshot_splits: str                     
    yearly_breakdown: List[SimulationYearlyBreakdownOut] = []

    model_config = {"from_attributes": True}


class SimulationSummary(BaseModel):
    id: int
    goal_id: int
    run_at: datetime
    success_rate: float
    median_outcome: float
    worst_10pct: float
    best_10pct: float        

    model_config = {"from_attributes": True}


#Dashboard

class GoalDashboardItem(BaseModel):
    goal: GoalOut
    latest_simulation: Optional[SimulationSummary] = None
    progress_pct: float                     


class DashboardOut(BaseModel):
    goals: List[GoalDashboardItem]
    total_monthly_allocation: float                   
    overall_confidence: Optional[float]               
    weakest_goal_id: Optional[int]                    
    total_target: float                               
    total_current_balance: float                      