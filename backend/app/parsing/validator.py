import io
import os
import re
import zipfile
from typing import Tuple, Optional

from app.parsing.exceptions import InvalidFileFormatError

# Canonical MIME types supported by ReqFlow
MIME_PDF = "application/pdf"
MIME_DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
MIME_TXT = "text/plain"

# Mapping of standard file extensions to canonical MIME types
EXTENSION_MIME_MAP = {
    "pdf": MIME_PDF,
    "docx": MIME_DOCX,
    "txt": MIME_TXT,
    "text": MIME_TXT,
    "md": MIME_TXT,
}

PDF_MAGIC = b"%PDF-"
ZIP_MAGIC_PREFIXES = (b"PK\x03\x04", b"PK\x05\x06", b"PK\x07\x08")


def sanitize_filename(filename: Optional[str]) -> str:
    """
    Sanitize an uploaded filename to prevent directory traversal,
    null-byte injection, and illegal control characters.
    """
    if not filename:
        return "unnamed_document"

    # Strip any leading directory paths (handles Unix and Windows style separators)
    clean_name = os.path.basename(filename.replace("\\", "/"))

    # Remove null bytes and control characters
    clean_name = re.sub(r"[\x00-\x1f\x7f-\x9f]", "", clean_name)

    # Strip leading/trailing whitespaces and dots
    clean_name = clean_name.strip(" .")

    if not clean_name:
        return "unnamed_document"

    # Limit filename length to 255 characters while preserving extension
    if len(clean_name) > 255:
        base, ext = os.path.splitext(clean_name)
        max_base_len = 255 - len(ext)
        clean_name = base[:max_base_len] + ext

    return clean_name


def is_valid_pdf_magic(file_bytes: bytes) -> bool:
    """
    Verify if the byte buffer contains the PDF magic signature (%PDF-).
    PDF specification allows preamble bytes up to the first 1024 bytes.
    """
    if len(file_bytes) < 5:
        return False
    header_chunk = file_bytes[:1024]
    return PDF_MAGIC in header_chunk


def is_valid_docx_structure(file_bytes: bytes) -> bool:
    """
    Verify if the byte buffer is a valid ZIP archive containing WordprocessingML structure.
    """
    if len(file_bytes) < 4:
        return False

    if not any(file_bytes.startswith(prefix) for prefix in ZIP_MAGIC_PREFIXES):
        return False

    try:
        with zipfile.ZipFile(io.BytesIO(file_bytes)) as zf:
            namelist = zf.namelist()
            # A valid DOCX package contains word/document.xml or [Content_Types].xml
            has_word_doc = "word/document.xml" in namelist or any(
                name.startswith("word/") and name.endswith(".xml") for name in namelist
            )
            has_content_types = "[Content_Types].xml" in namelist
            return has_word_doc and has_content_types
    except (zipfile.BadZipFile, Exception):
        return False


def is_valid_plain_text(file_bytes: bytes) -> bool:
    """
    Verify if the byte buffer is valid plain text and does not contain binary data or null bytes.
    """
    if not file_bytes:
        return True

    # Check for binary null bytes in the first 8KB
    sample = file_bytes[:8192]
    if b"\x00" in sample:
        return False

    # Attempt decodings across common text encodings
    for encoding in ("utf-8", "utf-16", "latin-1"):
        try:
            sample.decode(encoding)
            return True
        except (UnicodeDecodeError, LookupError):
            continue

    return False


def validate_file_upload(
    file_bytes: bytes,
    filename: Optional[str] = None,
    declared_content_type: Optional[str] = None,
) -> Tuple[str, str]:
    """
    Sniff MIME type from magic bytes and validate against declared content type and filename.
    Returns a tuple of (canonical_content_type, sanitized_filename).
    Raises InvalidFileFormatError if validation fails.
    """
    sanitized_name = sanitize_filename(filename)

    ext = ""
    if "." in sanitized_name:
        ext = sanitized_name.rsplit(".", 1)[-1].lower()

    # Determine intended format by extension or declared content-type
    target_type: Optional[str] = None

    if ext in EXTENSION_MIME_MAP:
        target_type = EXTENSION_MIME_MAP[ext]
    elif declared_content_type:
        declared = declared_content_type.lower().split(";")[0].strip()
        if declared in (MIME_PDF, MIME_DOCX, MIME_TXT):
            target_type = declared

    if not target_type:
        raise InvalidFileFormatError(
            f"Unsupported file format '{ext or 'unknown'}'. Please upload a PDF, DOCX, or TXT file."
        )

    # Perform magic bytes / deep content validation based on target type
    if target_type == MIME_PDF:
        if not is_valid_pdf_magic(file_bytes):
            raise InvalidFileFormatError(
                "Invalid PDF document: File header does not match PDF magic byte signature (%PDF-)."
            )
        return MIME_PDF, sanitized_name

    elif target_type == MIME_DOCX:
        if not is_valid_docx_structure(file_bytes):
            raise InvalidFileFormatError(
                "Invalid DOCX document: File is not a valid OpenXML Word document (.docx)."
            )
        return MIME_DOCX, sanitized_name

    elif target_type == MIME_TXT:
        if not is_valid_plain_text(file_bytes):
            raise InvalidFileFormatError(
                "Invalid text document: File contains binary executable data or corrupted bytes."
            )
        return MIME_TXT, sanitized_name

    raise InvalidFileFormatError(
        "Unsupported file type. Please upload a PDF, DOCX, or TXT file."
    )
