from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import date

DAILY_AI_LIMIT = 25

def check_and_increment_ai_usage(user_id: int, db: Session) -> None:
    today = date.today()

    result = db.execute(text("""
        INSERT INTO ai_usage (user_id, date, request_count)
        VALUES (:user_id, :date, 1)
        ON CONFLICT (user_id, date)
        DO UPDATE SET request_count = ai_usage.request_count + 1
        RETURNING request_count
    """), {"user_id": user_id, "date": today})

    db.commit()
    count = result.scalar()

    if count > DAILY_AI_LIMIT:
        try:
            from backend.routers.security_logger import log_security_event, AI_LIMIT_HIT
            log_security_event(db, AI_LIMIT_HIT, user_id=user_id,
                               detail=f"Daily limit of {DAILY_AI_LIMIT} exceeded")
        except Exception:
            pass

        raise HTTPException(
            status_code=429,
            detail=f"Daily AI limit of {DAILY_AI_LIMIT} requests reached. Resets at midnight."
        )