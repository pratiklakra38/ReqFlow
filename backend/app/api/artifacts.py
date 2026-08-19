from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from uuid import UUID

from app.db.session import get_db
from app.models.analysis import AmbiguityFlag, UserStory, AcceptanceCriteria, Task
from app.schemas.analysis import (
    UserStoryUpdate, UserStoryResponse,
    TaskUpdate, TaskResponse,
    AcceptanceCriteriaUpdate, AcceptanceCriteriaResponse,
    AmbiguityFlagUpdate, AmbiguityFlagResponse
)

router = APIRouter(prefix="/artifacts", tags=["artifacts"])

@router.put("/stories/{story_id}", response_model=UserStoryResponse)
def update_story(story_id: UUID, update_data: UserStoryUpdate, db: Session = Depends(get_db)):
    story = db.query(UserStory).filter(UserStory.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="User story not found.")

    for key, value in update_data.model_dump(exclude_unset=True).items():
        setattr(story, key, value)

    db.commit()
    db.refresh(story)
    return story

@router.put("/tasks/{task_id}", response_model=TaskResponse)
def update_task(task_id: UUID, update_data: TaskUpdate, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")

    for key, value in update_data.model_dump(exclude_unset=True).items():
        setattr(task, key, value)

    db.commit()
    db.refresh(task)
    return task

@router.put("/criteria/{criteria_id}", response_model=AcceptanceCriteriaResponse)
def update_criteria(criteria_id: UUID, update_data: AcceptanceCriteriaUpdate, db: Session = Depends(get_db)):
    crit = db.query(AcceptanceCriteria).filter(AcceptanceCriteria.id == criteria_id).first()
    if not crit:
        raise HTTPException(status_code=404, detail="Acceptance criteria not found.")

    for key, value in update_data.model_dump(exclude_unset=True).items():
        setattr(crit, key, value)

    db.commit()
    db.refresh(crit)
    return crit

@router.put("/ambiguities/{flag_id}", response_model=AmbiguityFlagResponse)
def update_ambiguity(flag_id: UUID, update_data: AmbiguityFlagUpdate, db: Session = Depends(get_db)):
    flag = db.query(AmbiguityFlag).filter(AmbiguityFlag.id == flag_id).first()
    if not flag:
        raise HTTPException(status_code=404, detail="Ambiguity flag not found.")

    for key, value in update_data.model_dump(exclude_unset=True).items():
        setattr(flag, key, value)

    db.commit()
    db.refresh(flag)
    return flag
