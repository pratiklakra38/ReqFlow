from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from uuid import UUID

from app.db.session import get_db
from app.models.document import Document
from app.models.analysis import AmbiguityFlag, Epic, UserStory, AcceptanceCriteria, Task, TestScenario
from app.schemas.analysis import AnalysisDetailResponse
from app.ai.pipeline import run_analysis_pipeline

router = APIRouter(prefix="/analyze", tags=["analysis"])

@router.post("/{doc_id}", response_model=AnalysisDetailResponse)
def analyze_document(doc_id: UUID, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    db.query(AmbiguityFlag).filter(AmbiguityFlag.document_id == doc_id).delete()
    db.query(Epic).filter(Epic.document_id == doc_id).delete()
    db.commit()

    try:
        pipeline_results = run_analysis_pipeline(doc.extracted_text)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"AI pipeline failed: {str(e)}")

    db_ambiguities = []
    for amb in pipeline_results.get("ambiguities", []):
        db_amb = AmbiguityFlag(
            document_id=doc_id,
            original_text=amb.get("original_text", ""),
            explanation=amb.get("explanation", ""),
            suggested_rewrite=amb.get("suggested_rewrite", "")
        )
        db.add(db_amb)
        db_ambiguities.append(db_amb)

    db_epics = []
    for epic_data in pipeline_results.get("epics", []):
        db_epic = Epic(
            document_id=doc_id,
            title=epic_data.get("title", "Feature"),
            description=epic_data.get("description", "")
        )
        db.add(db_epic)
        db.flush()

        for story_data in epic_data.get("stories", []):
            db_story = UserStory(
                epic_id=db_epic.id,
                title=story_data.get("title", ""),
                role=story_data.get("role", ""),
                goal=story_data.get("goal", ""),
                benefit=story_data.get("benefit", "")
            )
            db.add(db_story)
            db.flush()

            for crit in story_data.get("criteria", []):
                db_crit = AcceptanceCriteria(
                    story_id=db_story.id,
                    scenario=crit.get("scenario", ""),
                    given_text=crit.get("given_text", ""),
                    when_text=crit.get("when_text", ""),
                    then_text=crit.get("then_text", "")
                )
                db.add(db_crit)

            for tsk in story_data.get("tasks", []):
                db_tsk = Task(
                    story_id=db_story.id,
                    title=tsk.get("title", ""),
                    priority=tsk.get("priority", "Medium"),
                    description=tsk.get("description", "")
                )
                db.add(db_tsk)

            for tst in story_data.get("test_scenarios", []):
                db_tst = TestScenario(
                    story_id=db_story.id,
                    title=tst.get("title", ""),
                    steps=tst.get("steps", ""),
                    expected_result=tst.get("expected_result", "")
                )
                db.add(db_tst)

        db_epics.append(db_epic)

    db.commit()

    for amb in db_ambiguities:
        db.refresh(amb)
    for epic in db_epics:
        db.refresh(epic)

    return {
        "document_id": doc_id,
        "ambiguities": db_ambiguities,
        "epics": db_epics
    }

@router.get("/{doc_id}", response_model=AnalysisDetailResponse)
def get_artifacts(doc_id: UUID, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    db_ambiguities = db.query(AmbiguityFlag).filter(AmbiguityFlag.document_id == doc_id).all()
    db_epics = db.query(Epic).filter(Epic.document_id == doc_id).all()

    return {
        "document_id": doc_id,
        "ambiguities": db_ambiguities,
        "epics": db_epics
    }
