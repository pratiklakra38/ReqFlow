class ParsingError(Exception):
    """Base exception for document parsing failures."""
    pass


class InvalidFileFormatError(ParsingError):
    """Raised when file magic bytes do not match expected format or file header is corrupted."""
    pass


class EncryptedDocumentError(ParsingError):
    """Raised when a document is password-protected or encrypted."""
    pass


class ScannedDocumentError(ParsingError):
    """Raised when a document contains scanned images but no extractable machine-readable text."""
    pass


class EmptyDocumentError(ParsingError):
    """Raised when a document contains no readable text or content."""
    pass


class DocumentBoundsExceededError(ParsingError):
    """Raised when a document exceeds configured size or length limits."""
    pass
