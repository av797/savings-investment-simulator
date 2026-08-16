from fastapi import Depends, HTTPException, status, APIRouter, Request
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime, timezone
from passlib.context import CryptContext
from slowapi import Limiter
from slowapi.util import get_remote_address
import base64

from backend.db import models
from backend.db.database import get_db
from backend.schemas import UserCreate, UserOut, UserLogin, UserUpdate
from backend.security import create_access_token
from backend.dependencies import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])
limiter = Limiter(key_func=get_remote_address)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 2MB in bytes — base64 encoding adds ~33% overhead so we check the decoded size
MAX_AVATAR_BYTES = 2 * 1024 * 1024

ALLOWED_IMAGE_PREFIXES = (
    "data:image/jpeg;base64,",
    "data:image/png;base64,",
    "data:image/gif;base64,",
    "data:image/webp;base64,",
)


def hash_password(password: str):
    return pwd_context.hash(password)


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def validate_avatar(avatar: str) -> None:
    if avatar is None:
        return

    if not any(avatar.startswith(prefix) for prefix in ALLOWED_IMAGE_PREFIXES):
        raise HTTPException(
            status_code=400,
            detail="Avatar must be a valid image (JPEG, PNG, GIF, or WebP)"
        )

    try:
        base64_data = avatar.split(",", 1)[1]
        decoded = base64.b64decode(base64_data)
        if len(decoded) > MAX_AVATAR_BYTES:
            raise HTTPException(
                status_code=400,
                detail="Avatar must be under 2MB"
            )
    except (IndexError, ValueError):
        raise HTTPException(status_code=400, detail="Invalid avatar format")

@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    result = db.execute(text("SELECT 1")).scalar()
    return {"status": "ok", "db_result": result, "timestamp": datetime.now()}


@router.post("/users", status_code=201, response_model=UserOut)
@limiter.limit("10/hour")
def create_user(request: Request, user: UserCreate, db: Session = Depends(get_db)):

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


@router.post("/login")
@limiter.limit("20/minute")
def login(request: Request, user: UserLogin, db: Session = Depends(get_db)):
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


@router.get("/me", response_model=UserOut)
def get_user(user_id: int = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(
        models.User.id == user_id,
        models.User.is_active == True
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.patch("/me", response_model=UserOut)
def update_user(
    data: UserUpdate,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(
        models.User.id == user_id,
        models.User.is_active == True
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")


    valid_profiles = {"low", "medium", "high"}
    if data.risk_profile and data.risk_profile not in valid_profiles:
        raise HTTPException(
            status_code=400,
            detail=f"risk_profile must be one of {valid_profiles}"
        )

    if "avatar" in data.model_dump(exclude_unset=True) and data.avatar is not None:
        validate_avatar(data.avatar)

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user


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