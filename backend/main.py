from contextlib import asynccontextmanager
import threading
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from dotenv import load_dotenv
from backend.routers import users, simulations, goals, inflation, markets, analysis, chat, whatif, contributionschedule

load_dotenv()

limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])

MAX_BODY_SIZE = 1 * 1024 * 1024


def pretrain_model():
    try:
        from backend.db.database import SessionLocal
        from backend.simulations.market_data import get_historical_returns
        from backend.simulations.ml_models import _get_model
        db = SessionLocal()
        try:
            historical = get_historical_returns(db)
            if historical:
                _get_model(historical)
                print("ML model ready")
            else:
                print("No market data found — skipping ML pre-train")
        finally:
            db.close()
    except Exception as e:
        print(f"ML pre-train failed: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    thread = threading.Thread(target=pretrain_model, daemon=True)
    thread.start()
    yield


app = FastAPI(title="GoalIQ API", version="2.0.0", lifespan=lifespan)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)


@app.middleware("http")
async def limit_request_size(request: Request, call_next):
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > MAX_BODY_SIZE:
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=413,
            content={"detail": "Request body too large. Maximum size is 1MB."}
        )
    return await call_next(request)

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "connect-src 'self' https://goaliq-api-9sx6.onrender.com; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: blob:; "
        "font-src 'self' data:; "
        "frame-ancestors 'none';"
    )
    return response


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://savings-investment-simulator.vercel.app",
        "http://localhost:5173",
    ],
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(simulations.router)
app.include_router(goals.router)
app.include_router(inflation.router)
app.include_router(markets.router)
app.include_router(analysis.router)
app.include_router(chat.router)
app.include_router(whatif.router)
app.include_router(contributionschedule.router)


@app.get("/health")
def health_check():
    return {"status": "ok", "version": "2.0.0"}


@app.head("/health")
def health_check_head():
    return {}