#Enabling communication between db and python
from sqlalchemy import (
    Column,
    Integer,
    String,
    Numeric,
    Date,
    DateTime,
    ForeignKey,
    Text,
    Boolean
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(Text)
    age = Column(Integer)
    risk_profile = Column(Text)
    monthly_income = Column(Numeric)
    created_at = Column(DateTime, server_default=func.now())
    is_active = Column(Boolean, default=True)

    accounts = relationship("Account", back_populates="user")
    simulations = relationship("Simulation", back_populates="user")


class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    account_type = Column(Text)
    provider = Column(Text)
    currency = Column(Text)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="accounts")
    transactions = relationship("Transaction", back_populates="account")

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id"))
    date = Column(Date)
    amount = Column(Numeric)
    category = Column(Text)
    description = Column(Text)

    account = relationship("Account", back_populates="transactions")


class Simulation(Base):
    __tablename__ = "simulations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    strategy_name = Column(Text)
    starting_balance = Column(Numeric)
    monthly_contribution = Column(Numeric)
    expected_return = Column(Numeric)
    final_value = Column(Numeric)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="simulations")


class MarketReturn(Base):
    __tablename__ = "market_returns"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date)
    asset_class = Column(Text)
    return_pct = Column(Numeric)