from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from uuid import UUID
from app.db.session import get_db
from app.models.document import Document
from app.schemas.document import DocumentResponse, DocumentDetailResponse
from app.parsing.pdf_parser import parse_pdf
from app.parsing.docx_parser import parse_docx

router = APIRouter(prefix="/documents", tags=["documents"])

MAX_FILE_SIZE = 20 * 1024 * 1024  # 20MB

SUPPORTED_TYPES = {
    "text/plain": "txt",
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
}

@router.post("/upload", response_model=DocumentDetailResponse)
async def upload_document(file: UploadFile = File(...), db: Session = Depends(get_db)):
    file_bytes = await file.read()
    file_size = len(file_bytes)
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds the 20MB limit.")

    content_type = file.content_type
    filename = file.filename or "unknown"
    
    ext = filename.split(".")[-1].lower() if "." in filename else ""
    
    if content_type not in SUPPORTED_TYPES:
        if ext == "txt":
            content_type = "text/plain"
        elif ext == "pdf":
            content_type = "application/pdf"
        elif ext == "docx":
            content_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type. Please upload a PDF, DOCX, or TXT file.")

    extracted_text = ""
    try:
        if content_type == "text/plain":
            extracted_text = file_bytes.decode("utf-8", errors="replace")
        elif content_type == "application/pdf":
            extracted_text = parse_pdf(file_bytes)
        elif content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
            extracted_text = parse_docx(file_bytes)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Failed to parse document: {str(e)}")

    if not extracted_text.strip():
        raise HTTPException(status_code=422, detail="No readable text could be extracted from the document.")

    try:
        db_document = Document(
            filename=filename,
            content_type=content_type,
            file_size=file_size,
            extracted_text=extracted_text
        )
        db.add(db_document)
        db.commit()
        db.refresh(db_document)
        return db_document
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database failed to save document: {str(e)}")

@router.get("/{doc_id}", response_model=DocumentDetailResponse)
def get_document(doc_id: UUID, db: Session = Depends(get_db)):
    db_document = db.query(Document).filter(Document.id == doc_id).first()
    if not db_document:
        raise HTTPException(status_code=404, detail="Document not found.")
    return db_document
