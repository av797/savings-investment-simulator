from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text

from backend.db import models
from backend.db.database import get_db
from backend.schemas import UserCreate

app = FastAPI()

#Test health check
@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    result = db.execute(text("SELECT 1")).scalar()
    return {"status": "ok", "db_result": result}

#POST to Users
@app.post("/users", status_code=201)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()

    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = models.User(
    email=user.email,
    age=user.age,
    risk_profile=user.risk_profile,
    monthly_income=user.monthly_income
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"id": new_user.id, "email": new_user.email}
