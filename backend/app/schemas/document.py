from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

class DocumentBase(BaseModel):
    filename: str
    content_type: str
    file_size: int

class DocumentCreate(DocumentBase):
    extracted_text: str

class DocumentResponse(DocumentBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

class DocumentDetailResponse(DocumentResponse):
    extracted_text: str
