import pymupdf as fitz
from app.parsing.exceptions import (
    ParsingError,
    InvalidFileFormatError,
    EncryptedDocumentError,
    ScannedDocumentError,
    EmptyDocumentError,
)


def parse_pdf(file_bytes: bytes) -> str:
    """
    Parse text from a PDF byte stream with comprehensive diagnostics:
    - Detects password protection / encryption
    - Detects scanned / image-only documents without OCR
    - Detects empty documents
    """
    doc = None
    try:
        try:
            doc = fitz.open(stream=file_bytes, filetype="pdf")
        except Exception as e:
            raise InvalidFileFormatError(f"Corrupted or invalid PDF file: {str(e)}")

        # Check for password-protected / encrypted PDF
        if getattr(doc, "is_encrypted", False) or getattr(doc, "needs_pass", False):
            raise EncryptedDocumentError(
                "The uploaded PDF is password-protected or encrypted. Please provide an unencrypted version."
            )

        if len(doc) == 0:
            raise EmptyDocumentError("The uploaded PDF document contains 0 pages.")

        text_content = []
        image_count = 0
        drawing_count = 0

        for page in doc:
            page_text = page.get_text()
            if page_text and page_text.strip():
                text_content.append(page_text)

            try:
                images = page.get_images()
                image_count += len(images)
            except Exception:
                pass

            try:
                drawings = page.get_drawings()
                drawing_count += len(drawings)
            except Exception:
                pass

        extracted_text = "\n".join(text_content).strip()

        # Check if text is empty or virtually empty (< 3 words)
        words = extracted_text.split()
        if len(words) < 3:
            if image_count > 0 or drawing_count > 0:
                raise ScannedDocumentError(
                    "Scanned PDF document detected. The document contains images but no machine-readable/selectable text. "
                    "Please upload an OCR-processed or text-based document."
                )
            raise EmptyDocumentError("The uploaded PDF document contains no readable text.")

        return extracted_text

    except (
        InvalidFileFormatError,
        EncryptedDocumentError,
        ScannedDocumentError,
        EmptyDocumentError,
    ):
        raise
    except Exception as e:
        raise ParsingError(f"Failed to parse PDF document: {str(e)}")
    finally:
        if doc is not None:
            try:
                doc.close()
            except Exception:
                pass
