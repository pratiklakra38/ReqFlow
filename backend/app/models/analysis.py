import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.session import Base

class AmbiguityFlag(Base):
    __tablename__ = "ambiguity_flags"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    original_text = Column(Text, nullable=False)
    explanation = Column(Text, nullable=False)
    suggested_rewrite = Column(Text, nullable=False)
    status = Column(String(50), default="active")  # active, resolved, ignored
    created_at = Column(DateTime, default=datetime.utcnow)

    document = relationship("Document", back_populates="ambiguity_flags")

class Epic(Base):
    __tablename__ = "epics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    document = relationship("Document", back_populates="epics")
    stories = relationship("UserStory", back_populates="epic", cascade="all, delete-orphan")

class UserStory(Base):
    __tablename__ = "user_stories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    epic_id = Column(UUID(as_uuid=True), ForeignKey("epics.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    role = Column(String(255), nullable=False)
    goal = Column(Text, nullable=False)
    benefit = Column(Text, nullable=False)
    status = Column(String(50), default="pending")  # pending, approved, rejected
    github_issue_url = Column(String(500), nullable=True)
    github_issue_number = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    epic = relationship("Epic", back_populates="stories")
    criteria = relationship("AcceptanceCriteria", back_populates="story", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="story", cascade="all, delete-orphan")
    test_scenarios = relationship("TestScenario", back_populates="story", cascade="all, delete-orphan")

class AcceptanceCriteria(Base):
    __tablename__ = "acceptance_criteria"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    story_id = Column(UUID(as_uuid=True), ForeignKey("user_stories.id", ondelete="CASCADE"), nullable=False)
    scenario = Column(String(255), nullable=False)
    given_text = Column(Text, nullable=False)
    when_text = Column(Text, nullable=False)
    then_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    story = relationship("UserStory", back_populates="criteria")

class Task(Base):
    __tablename__ = "tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    story_id = Column(UUID(as_uuid=True), ForeignKey("user_stories.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    priority = Column(String(50), nullable=False)  # High, Medium, Low
    description = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    story = relationship("UserStory", back_populates="tasks")

class TestScenario(Base):
    __tablename__ = "test_scenarios"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    story_id = Column(UUID(as_uuid=True), ForeignKey("user_stories.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    steps = Column(Text, nullable=False)
    expected_result = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    story = relationship("UserStory", back_populates="test_scenarios")
