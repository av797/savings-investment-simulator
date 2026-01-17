from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from db.database import get_db
from db.models import User

app = FastAPI()

#Test health check
@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    result = db.execute("SELECT 1").scalar()
    return {"status": "ok", "db_result": result}