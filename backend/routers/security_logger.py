from sqlalchemy.orm import Session
from datetime import datetime


LOGIN_SUCCESS       = "login_success"
LOGIN_FAILED        = "login_failed"
ACCOUNT_LOCKED      = "account_locked"
RATE_LIMIT_HIT      = "rate_limit_hit"
INVALID_TOKEN       = "invalid_token"
AI_LIMIT_HIT        = "ai_limit_hit"
AVATAR_REJECTED     = "avatar_rejected"
ACCOUNT_DELETED     = "account_deleted"
REGISTER_SUCCESS    = "register_success"


def log_security_event(
    db: Session,
    event_type: str,
    ip_address: str = None,
    user_id: int = None,
    detail: str = None,
) -> None:
    try:
        db.execute(
            __import__('sqlalchemy').text("""
                INSERT INTO security_events (event_type, user_id, ip_address, detail, created_at)
                VALUES (:event_type, :user_id, :ip_address, :detail, :created_at)
            """),
            {
                "event_type": event_type,
                "user_id":    user_id,
                "ip_address": ip_address,
                "detail":     detail,
                "created_at": datetime.utcnow(),
            }
        )
        db.commit()
    except Exception as e:
        print(f"Security log error: {e}")