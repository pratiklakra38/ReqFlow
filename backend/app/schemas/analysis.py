from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import List, Optional

# Ambiguity Schemas
class AmbiguityFlagBase(BaseModel):
    original_text: str
    explanation: str
    suggested_rewrite: str

class AmbiguityFlagResponse(AmbiguityFlagBase):
    id: UUID
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# Acceptance Criteria Schemas
class AcceptanceCriteriaBase(BaseModel):
    scenario: str
    given_text: str
    when_text: str
    then_text: str

class AcceptanceCriteriaResponse(AcceptanceCriteriaBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

# Task Schemas
class TaskBase(BaseModel):
    title: str
    priority: str
    description: str

class TaskResponse(TaskBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

# Test Scenario Schemas
class TestScenarioBase(BaseModel):
    title: str
    steps: str
    expected_result: str

class TestScenarioResponse(TestScenarioBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

# User Story Schemas
class UserStoryBase(BaseModel):
    title: str
    role: str
    goal: str
    benefit: str

class UserStoryResponse(UserStoryBase):
    id: UUID
    status: str
    github_issue_url: Optional[str] = None
    github_issue_number: Optional[int] = None
    created_at: datetime
    criteria: List[AcceptanceCriteriaResponse] = []
    tasks: List[TaskResponse] = []
    test_scenarios: List[TestScenarioResponse] = []

    class Config:
        from_attributes = True

# Epic Schemas
class EpicBase(BaseModel):
    title: str
    description: str

class EpicResponse(EpicBase):
    id: UUID
    created_at: datetime
    stories: List[UserStoryResponse] = []

    class Config:
        from_attributes = True

# Aggregate Analysis Response
class AnalysisDetailResponse(BaseModel):
    document_id: UUID
    ambiguities: List[AmbiguityFlagResponse] = []
    epics: List[EpicResponse] = []

# Update Schemas

class UserStoryUpdate(BaseModel):
    title: Optional[str] = None
    role: Optional[str] = None
    goal: Optional[str] = None
    benefit: Optional[str] = None
    status: Optional[str] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    priority: Optional[str] = None
    description: Optional[str] = None

class AcceptanceCriteriaUpdate(BaseModel):
    scenario: Optional[str] = None
    given_text: Optional[str] = None
    when_text: Optional[str] = None
    then_text: Optional[str] = None

class AmbiguityFlagUpdate(BaseModel):
    status: Optional[str] = None
