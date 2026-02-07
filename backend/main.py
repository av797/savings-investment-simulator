from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime
from passlib.context import CryptContext

from backend.db import models
from backend.db.database import get_db
from backend.schemas import UserCreate, UserOut, UserLogin

app = FastAPI()

pwd_context  = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str):
    
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

#Test health check
@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    result = db.execute(text("SELECT 1")).scalar()
    return {
        "status": "ok",
        "db_result": result,
        "timestamp": datetime.now()
    }


#login endpoint
@app.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    #find user by email
    db_user = db.query(models.User).filter(
        models.User.email == user.email,
        models.User.is_active == True
    ).first()

    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    db_user.last_login = datetime.now()
    db.commit()

    return {"message": "Login successful", "user_id": db_user.id, "email": db_user.email}

#POST to Users
@app.post("/users", status_code=201, response_model=UserOut)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()

    #check if user exists
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    print("Raw password:", repr(user.password))
    print("Type:", type(user.password))
    print("Length of string:", len(user.password))
    print("Length in bytes:", len(user.password.encode("utf-8")))
    #hash password
    hashed_password = hash_password(user.password)

    new_user = models.User(
        email=user.email,
        password_hash=hashed_password,
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