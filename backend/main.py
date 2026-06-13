from fastapi import FastAPI
from backend.routers import users, simulations, goals, inflation
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="GoalIQ API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(simulations.router)
app.include_router(goals.router)
app.include_router(inflation.router)

@app.get("/health")
def health_check():
    return {"status": "ok", "version": "2.0.0"}
