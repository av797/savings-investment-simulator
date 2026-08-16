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
        raise HTTPException(
            status_code=429,
            detail=f"Daily AI limit of {DAILY_AI_LIMIT} requests reached. Resets at midnight."
        )