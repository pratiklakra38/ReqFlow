from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional
from pydantic import BaseModel

from app.db.session import get_db
from app.models.document import Document
from app.models.analysis import Epic, UserStory
from app.integrations.github_adapter import push_story_to_github
from app.core.config import settings

router = APIRouter(prefix="/export", tags=["export"])

class ExportRequest(BaseModel):
    repo: str
    token: Optional[str] = None  # Falls back to GITHUB_TOKEN in .env if not provided

class ExportConfig(BaseModel):
    has_server_token: bool

@router.get("/config", response_model=ExportConfig)
def get_export_config():
    """Returns whether the server has a pre-configured GitHub token."""
    return ExportConfig(has_server_token=bool(settings.GITHUB_TOKEN))

class ExportedStoryInfo(BaseModel):
    story_id: UUID
    title: str
    github_url: str
    issue_number: int

class ExportResponse(BaseModel):
    exported_stories: List[ExportedStoryInfo]

@router.post("/{doc_id}", response_model=ExportResponse)
def export_backlog(doc_id: UUID, req: ExportRequest, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    # Resolve token: use provided token or fall back to server-configured GITHUB_TOKEN
    resolved_token = (req.token or "").strip() or settings.GITHUB_TOKEN
    if not resolved_token:
        raise HTTPException(
            status_code=400,
            detail="No GitHub token provided. Enter a PAT in the export form or configure GITHUB_TOKEN in .env."
        )

    approved_stories = (
        db.query(UserStory)
        .join(Epic)
        .filter(Epic.document_id == doc_id)
        .filter(UserStory.status == "approved")
        .all()
    )

    if not approved_stories:
        raise HTTPException(
            status_code=400,
            detail="No approved user stories found to export. Please approve at least one user story first."
        )

    exported_list = []
    errors = []

    for story in approved_stories:
        story_dict = {
            "title": story.title,
            "role": story.role,
            "goal": story.goal,
            "benefit": story.benefit,
            "criteria": [
                {
                    "scenario": c.scenario,
                    "given_text": c.given_text,
                    "when_text": c.when_text,
                    "then_text": c.then_text
                }
                for c in story.criteria
            ],
            "tasks": [
                {
                    "title": t.title,
                    "priority": t.priority,
                    "description": t.description
                }
                for t in story.tasks
            ],
            "test_scenarios": [
                {
                    "title": tst.title,
                    "steps": tst.steps,
                    "expected_result": tst.expected_result
                }
                for tst in story.test_scenarios
            ]
        }

        epic_title = story.epic.title if story.epic else ""

        res = push_story_to_github(req.repo, resolved_token, story_dict, epic_title)

        if res.get("success"):
            story.github_issue_url = res.get("url")
            story.github_issue_number = res.get("number")
            db.add(story)

            exported_list.append(ExportedStoryInfo(
                story_id=story.id,
                title=story.title,
                github_url=res.get("url"),
                issue_number=res.get("number")
            ))
        else:
            errors.append(f"Story '{story.title}': {res.get('error')}")

    if errors and len(exported_list) == 0:
        raise HTTPException(
            status_code=422,
            detail=f"Failed to export backlog to GitHub: {'; '.join(errors)}"
        )

    db.commit()

    return ExportResponse(exported_stories=exported_list)
