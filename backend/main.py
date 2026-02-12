from fastapi import FastAPI
from backend.routers import users, simulations

app = FastAPI()

app.include_router(users.router)
app.include_router(simulations.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
