from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from uuid import UUID
import logging

from app.core.config import settings
from app.db.session import get_db
from app.models.document import Document
from app.schemas.document import DocumentDetailResponse
from app.parsing.exceptions import (
    ParsingError,
    InvalidFileFormatError,
    EncryptedDocumentError,
    ScannedDocumentError,
    EmptyDocumentError,
)
from app.parsing.validator import validate_file_upload, MIME_PDF, MIME_DOCX, MIME_TXT
from app.parsing.sanitizer import sanitize_text, enforce_text_bounds
from app.parsing.pdf_parser import parse_pdf
from app.parsing.docx_parser import parse_docx

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("/upload", response_model=DocumentDetailResponse)
async def upload_document(file: UploadFile = File(...), db: Session = Depends(get_db)):
    max_bytes = settings.MAX_DOCUMENT_SIZE_MB * 1024 * 1024

    try:
        file_bytes = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read uploaded file: {str(e)}")

    file_size = len(file_bytes)
    if file_size > max_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"File size ({file_size / (1024 * 1024):.2f}MB) exceeds the {settings.MAX_DOCUMENT_SIZE_MB}MB limit."
        )

    # 1. MIME sniffing & Magic Bytes Validation + Filename Sanitization
    try:
        content_type, clean_filename = validate_file_upload(
            file_bytes=file_bytes,
            filename=file.filename,
            declared_content_type=file.content_type,
        )
    except InvalidFileFormatError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # 2. Text Extraction & Format Diagnostics
    raw_extracted_text = ""
    try:
        if content_type == MIME_TXT:
            # Multi-encoding decode fallback
            decoded = None
            for enc in ("utf-8", "utf-16", "latin-1"):
                try:
                    decoded = file_bytes.decode(enc)
                    break
                except UnicodeDecodeError:
                    continue

            if decoded is None:
                raise InvalidFileFormatError("Text file encoding is not supported or corrupted.")

            if not decoded.strip():
                raise EmptyDocumentError("The uploaded text document contains no readable text.")

            raw_extracted_text = decoded

        elif content_type == MIME_PDF:
            raw_extracted_text = parse_pdf(file_bytes)

        elif content_type == MIME_DOCX:
            raw_extracted_text = parse_docx(file_bytes)

    except InvalidFileFormatError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except (EncryptedDocumentError, ScannedDocumentError, EmptyDocumentError) as e:
        raise HTTPException(status_code=422, detail=str(e))
    except ParsingError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected document parsing failure: {str(e)}")
        raise HTTPException(status_code=422, detail=f"Failed to parse document: {str(e)}")

    # 3. Text Sanitization & Bounding
    clean_text = sanitize_text(raw_extracted_text)
    if not clean_text:
        raise HTTPException(status_code=422, detail="No readable text could be extracted from the document.")

    bounded_text, was_truncated = enforce_text_bounds(
        clean_text,
        max_chars=settings.MAX_DOCUMENT_CHARS
    )
    if was_truncated:
        logger.warning(
            f"Document '{clean_filename}' was truncated to {settings.MAX_DOCUMENT_CHARS} characters."
        )

    # 4. Atomic Database Persistence
    try:
        db_document = Document(
            filename=clean_filename,
            content_type=content_type,
            file_size=file_size,
            extracted_text=bounded_text,
        )
        db.add(db_document)
        db.commit()
        db.refresh(db_document)
        return db_document
    except Exception as e:
        db.rollback()
        logger.error(f"Database failed to save document: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database failed to save document: {str(e)}")


@router.get("/{doc_id}", response_model=DocumentDetailResponse)
def get_document(doc_id: UUID, db: Session = Depends(get_db)):
    db_document = db.query(Document).filter(Document.id == doc_id).first()
    if not db_document:
        raise HTTPException(status_code=404, detail="Document not found.")
    return db_document
