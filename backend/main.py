from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from dotenv import load_dotenv
from backend.routers import users, simulations, goals, inflation, markets, analysis, chat, whatif, contributionschedule

load_dotenv()

limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])

app = FastAPI(title="GoalIQ API", version="2.0.0")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

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