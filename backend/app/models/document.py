import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Text, DateTime, Uuid
from sqlalchemy.orm import relationship
from app.db.session import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    filename = Column(String(255), nullable=False)
    content_type = Column(String(100), nullable=False)
    file_size = Column(Integer, nullable=False)
    extracted_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    ambiguity_flags = relationship("AmbiguityFlag", back_populates="document", cascade="all, delete-orphan")
    epics = relationship("Epic", back_populates="document", cascade="all, delete-orphan")
