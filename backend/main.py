from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime

from backend.db import models
from backend.db.database import get_db
from backend.schemas import UserCreate, UserOut

app = FastAPI()

#Test health check
@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    result = db.execute(text("SELECT 1")).scalar()
    return {
        "status": "ok",
        "db_result": result,
        "timestamp": datetime.now()
    }

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
        monthly_income=user.monthly_income,
        created_at=datetime.now()
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

#Get users endpoint
@app.get("/users/{user_id}", response_model=UserOut)
def get_user(user_id: int, db: Session = Depends(get_db)):
    #only returning active users for now
    user = db.query(models.User).filter(
        models.User.id == user_id,
        models.User.is_active == True
        ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

#delete users endpoint
@app.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    # Find the user only if active
    user = db.query(models.User).filter(
        models.User.id == user_id,
        models.User.is_active == True
    ).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Soft delete
    user.is_active = False
    db.commit()
    # 204 No Content means no body is returned
    return