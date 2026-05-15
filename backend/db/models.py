from sqlalchemy import (
    Column,
    Integer,
    String,
    Numeric,
    Date,
    DateTime,
    ForeignKey,
    Text,
    Boolean,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .database import Base


# ── Users ──

class User(Base):
    __tablename__ = "users"

    id             = Column(Integer, primary_key=True, index=True)
    email          = Column(String(255), unique=True, index=True, nullable=False)
    age            = Column(Integer)
    risk_profile   = Column(Text)
    monthly_income = Column(Numeric)
    created_at     = Column(DateTime, server_default=func.now())
    is_active      = Column(Boolean, default=True)
    password_hash  = Column(String, nullable=False)
    last_login     = Column(DateTime, nullable=True)

    goals    = relationship("Goal", back_populates="user", cascade="all, delete-orphan")
    accounts = relationship("Account", back_populates="user")


# ── Accounts & Transactions ──

class Account(Base):
    __tablename__ = "accounts"

    id           = Column(Integer, primary_key=True, index=True)
    user_id      = Column(Integer, ForeignKey("users.id"))
    account_type = Column(Text)
    provider     = Column(Text)
    currency     = Column(Text)
    created_at   = Column(DateTime, server_default=func.now())

    user         = relationship("User", back_populates="accounts")
    transactions = relationship("Transaction", back_populates="account")


class Transaction(Base):
    __tablename__ = "transactions"

    id          = Column(Integer, primary_key=True, index=True)
    account_id  = Column(Integer, ForeignKey("accounts.id"))
    date        = Column(Date)
    amount      = Column(Numeric)
    category    = Column(Text)
    description = Column(Text)

    account = relationship("Account", back_populates="transactions")


# ── Goals ──

class Goal(Base):
    __tablename__ = "goals"

    id                   = Column(Integer, primary_key=True, index=True)
    user_id              = Column(Integer, ForeignKey("users.id"), nullable=False)
    name                 = Column(Text, nullable=False)
    goal_type            = Column(Text, default="other")
    target_amount        = Column(Numeric, nullable=False)
    monthly_allocation   = Column(Numeric, nullable=False)
    years                = Column(Integer, nullable=False)
    inflation_rate       = Column(Numeric, default=0.0)
    current_balance      = Column(Numeric, default=0.0)
    status               = Column(Text, default="active")
    notes                = Column(Text, nullable=True)
    created_at           = Column(DateTime, server_default=func.now())
    updated_at           = Column(DateTime, server_default=func.now(), onupdate=func.now())

    user        = relationship("User", back_populates="goals")
    splits      = relationship("GoalSplit", back_populates="goal", cascade="all, delete-orphan")
    simulations = relationship("Simulation", back_populates="goal", cascade="all, delete-orphan")


# ── Goal Splits ──

class GoalSplit(Base):
    __tablename__ = "goal_splits"

    id                       = Column(Integer, primary_key=True, index=True)
    goal_id                  = Column(Integer, ForeignKey("goals.id"), nullable=False)
    asset_class              = Column(Text, nullable=False)
    percentage               = Column(Numeric, nullable=False)
    expected_return_override = Column(Numeric, nullable=True)

    goal = relationship("Goal", back_populates="splits")


# ── Simulations ──

class Simulation(Base):
    __tablename__ = "simulations"

    id                          = Column(Integer, primary_key=True, index=True)
    goal_id                     = Column(Integer, ForeignKey("goals.id"), nullable=False)
    run_at                      = Column(DateTime, server_default=func.now())
    scenario_count              = Column(Integer, default=10000)
    success_rate                = Column(Numeric)
    median_outcome              = Column(Numeric)
    worst_10pct                 = Column(Numeric)
    best_10pct                  = Column(Numeric)
    snapshot_target_amount      = Column(Numeric)
    snapshot_monthly_allocation = Column(Numeric)
    snapshot_years              = Column(Integer)
    snapshot_inflation_rate     = Column(Numeric)
    snapshot_splits             = Column(Text)

    goal             = relationship("Goal", back_populates="simulations")
    yearly_breakdown = relationship("SimulationYearlyBreakdown", back_populates="simulation", cascade="all, delete-orphan")


# ── Simulation Yearly Breakdown ──

class SimulationYearlyBreakdown(Base):
    __tablename__ = "simulation_yearly_breakdown"

    id             = Column(Integer, primary_key=True, index=True)
    simulation_id  = Column(Integer, ForeignKey("simulations.id"), nullable=False)
    year           = Column(Integer, nullable=False)
    p10_balance    = Column(Numeric)
    median_balance = Column(Numeric)
    p90_balance    = Column(Numeric)
    contributions  = Column(Numeric)

    simulation = relationship("Simulation", back_populates="yearly_breakdown")


# ── Market Returns ──

class MarketReturn(Base):
    __tablename__ = "market_returns"

    id          = Column(Integer, primary_key=True, index=True)
    date        = Column(Date)
    asset_class = Column(Text)
    return_pct  = Column(Numeric)