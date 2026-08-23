from fastapi import Depends, HTTPException, status, APIRouter, Request
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from slowapi import Limiter
from slowapi.util import get_remote_address
import base64

from backend.db import models
from backend.db.database import get_db
from backend.schemas import UserCreate, UserOut, UserLogin, UserUpdate
from backend.security import create_access_token
from backend.dependencies import get_current_user
from backend.routers.security_logger import (
    log_security_event,
    LOGIN_SUCCESS, LOGIN_FAILED, ACCOUNT_LOCKED,
    AVATAR_REJECTED, ACCOUNT_DELETED, REGISTER_SUCCESS,
)

router = APIRouter(prefix="/users", tags=["Users"])
limiter = Limiter(key_func=get_remote_address)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

MAX_AVATAR_BYTES = 2 * 1024 * 1024
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_MINUTES = 15

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


def validate_avatar(avatar: str, user_id: int, ip: str, db: Session) -> None:
    if avatar is None:
        return

    if not any(avatar.startswith(prefix) for prefix in ALLOWED_IMAGE_PREFIXES):
        log_security_event(db, AVATAR_REJECTED, ip_address=ip, user_id=user_id,
                           detail="Invalid image type")
        raise HTTPException(
            status_code=400,
            detail="Avatar must be a valid image (JPEG, PNG, GIF, or WebP)"
        )

    try:
        base64_data = avatar.split(",", 1)[1]
        decoded     = base64.b64decode(base64_data)
        if len(decoded) > MAX_AVATAR_BYTES:
            log_security_event(db, AVATAR_REJECTED, ip_address=ip, user_id=user_id,
                               detail=f"File too large: {len(decoded)} bytes")
            raise HTTPException(status_code=400, detail="Avatar must be under 2MB")
    except (IndexError, ValueError):
        raise HTTPException(status_code=400, detail="Invalid avatar format")


def get_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


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

    log_security_event(db, REGISTER_SUCCESS, ip_address=get_ip(request),
                       user_id=new_user.id, detail=user.email)

    return new_user


@router.post("/login")
@limiter.limit("20/minute")
def login(request: Request, user: UserLogin, db: Session = Depends(get_db)):
    ip = get_ip(request)

    db_user = db.query(models.User).filter(
        models.User.email == user.email,
        models.User.is_active == True
    ).first()

    invalid_error = HTTPException(status_code=401, detail="Invalid email or password")

    if not db_user:
        log_security_event(db, LOGIN_FAILED, ip_address=ip, detail=f"Unknown email: {user.email}")
        raise invalid_error

    now = datetime.now(timezone.utc)
    if db_user.locked_until and db_user.locked_until.replace(tzinfo=timezone.utc) > now:
        minutes_remaining = int(
            (db_user.locked_until.replace(tzinfo=timezone.utc) - now).total_seconds() / 60
        ) + 1
        raise HTTPException(
            status_code=423,
            detail=f"Account temporarily locked. Try again in {minutes_remaining} minute{'s' if minutes_remaining != 1 else ''}."
        )

    if not verify_password(user.password, db_user.password_hash):
        db_user.failed_login_attempts = (db_user.failed_login_attempts or 0) + 1

        if db_user.failed_login_attempts >= MAX_FAILED_ATTEMPTS:
            db_user.locked_until          = now + timedelta(minutes=LOCKOUT_MINUTES)
            db_user.failed_login_attempts = 0
            db.commit()
            log_security_event(db, ACCOUNT_LOCKED, ip_address=ip, user_id=db_user.id,
                               detail=f"Locked for {LOCKOUT_MINUTES} minutes")
            raise HTTPException(
                status_code=423,
                detail=f"Too many failed attempts. Account locked for {LOCKOUT_MINUTES} minutes."
            )

        db.commit()
        log_security_event(db, LOGIN_FAILED, ip_address=ip, user_id=db_user.id,
                           detail=f"Attempt {db_user.failed_login_attempts}")
        raise invalid_error

    db_user.failed_login_attempts = 0
    db_user.locked_until          = None
    db_user.last_login            = now
    db.commit()

    log_security_event(db, LOGIN_SUCCESS, ip_address=ip, user_id=db_user.id)

    access_token = create_access_token(data={"user_id": db_user.id})
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
    request: Request,
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
        validate_avatar(data.avatar, user_id=user_id, ip=get_ip(request), db=db)

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    request: Request,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(
        models.User.id == user_id,
        models.User.is_active == True
    ).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    log_security_event(db, ACCOUNT_DELETED, ip_address=get_ip(request),
                       user_id=user_id, detail=user.email)

    user.is_active = False
    db.commit()

    return