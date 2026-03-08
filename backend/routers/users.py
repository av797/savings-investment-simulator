from fastapi import Depends, HTTPException, status, APIRouter
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime, timezone
from passlib.context import CryptContext

from backend.db import models
from backend.db.database import get_db
from backend.schemas import UserCreate, UserOut, UserLogin
from backend.security import create_access_token
from backend.dependencies import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str):
    return pwd_context.hash(password)


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


# Health check
@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    result = db.execute(text("SELECT 1")).scalar()
    return {
        "status": "ok",
        "db_result": result,
        "timestamp": datetime.now()
    }


# Register
@router.post("/users", status_code=201, response_model=UserOut)
def create_user(user: UserCreate, db: Session = Depends(get_db)):

    existing_user = db.query(models.User).filter(models.User.email == user.email).first()


    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")


    new_user = models.User(
        email=user.email,
        password_hash=hash_password(user.password),
        age=user.age,
        risk_profile=user.risk_profile,
        monthly_income=user.monthly_income,
        created_at=datetime.now()
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user


# Login
@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(
        models.User.email == user.email,
        models.User.is_active == True
    ).first()

    if not db_user or not verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    access_token = create_access_token(data={"user_id": db_user.id})
    db_user.last_login = datetime.now(timezone.utc)
    db.commit()

    return {"access_token": access_token, "token_type": "bearer"}


# Get current user
@router.get("/me", response_model=UserOut)
def get_user(user_id: int = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(
        models.User.id == user_id,
        models.User.is_active == True
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# Soft delete current user
@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int = Depends(get_current_user), db: Session = Depends(get_db)):

    user = db.query(models.User).filter(
        models.User.id == user_id,
        models.User.is_active == True
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    
    user.is_active = False
    db.commit()
    
    return