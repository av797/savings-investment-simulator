from fastapi import FastAPI
from backend.routers import users, simulations
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.include_router(users.router)
app.include_router(simulations.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten this later
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok"}
