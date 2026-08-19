from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy.sql import text
from app.db.session import get_db, Base, engine
from app.models.document import Document
from app.models.analysis import AmbiguityFlag, Epic, UserStory, AcceptanceCriteria, Task, TestScenario
from app.api.upload import router as upload_router
from app.api.analyze import router as analyze_router
from app.api.artifacts import router as artifacts_router
from app.api.export import router as export_router

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="ReqFlow API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload_router)
app.include_router(analyze_router)
app.include_router(artifacts_router)
app.include_router(export_router)

@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    db_status = "disconnected"
    try:
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    return {
        "status": "ok",
        "database": db_status
    }
