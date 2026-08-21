import re
from typing import Tuple

# Non-printable control characters excluding \t, \n, \r
CONTROL_CHAR_REGEX = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")

# Invisible and zero-width characters
ZERO_WIDTH_REGEX = re.compile(r"[\u200b\u200c\u200d\u2060\ufeff\u00ad\u200e\u200f]")

# Unicode spaces to be normalized to standard space ' '
UNICODE_SPACES_REGEX = re.compile(r"[\u00a0\u2000-\u200a\u202f\u205f\u3000]")

# 3 or more consecutive newlines to be collapsed to 2 newlines
CONSECUTIVE_NEWLINES_REGEX = re.compile(r"\n{3,}")


def sanitize_text(raw_text: str) -> str:
    """
    Sanitize extracted text:
    1. Removes non-printable control characters (while preserving \\n, \\t, \\r).
    2. Strips invisible zero-width characters and BOMs.
    3. Normalizes Unicode whitespace and non-breaking spaces to standard space.
    4. Normalizes carriage returns (\\r\\n and \\r) to standard \\n.
    5. Strips trailing whitespace on individual lines and collapses excessive blank lines.
    """
    if not raw_text:
        return ""

    # Normalize line endings
    text = raw_text.replace("\r\n", "\n").replace("\r", "\n")

    # Remove non-printable control characters
    text = CONTROL_CHAR_REGEX.sub("", text)

    # Remove zero-width and invisible characters
    text = ZERO_WIDTH_REGEX.sub("", text)

    # Normalize Unicode spaces
    text = UNICODE_SPACES_REGEX.sub(" ", text)

    # Clean line by line: strip trailing whitespaces
    lines = [line.rstrip() for line in text.split("\n")]
    text = "\n".join(lines)

    # Collapse excessive blank lines (more than 2 consecutive newlines)
    text = CONSECUTIVE_NEWLINES_REGEX.sub("\n\n", text)

    return text.strip()


def enforce_text_bounds(
    text: str,
    max_chars: int = 150000,
    truncation_notice: str = "\n\n[Note: Document content truncated to meet maximum processing length bounds.]"
) -> Tuple[str, bool]:
    """
    Guards against LLM context window overflow and excessive token usage by enforcing
    a safe upper bound on character length.
    Truncates at a natural boundary (paragraph or sentence) if bounds are exceeded.
    Returns (processed_text, was_truncated).
    """
    if not text:
        return "", False

    if len(text) <= max_chars:
        return text, False

    # Attempt to truncate at paragraph boundary within a 1000 char window before max_chars
    cutoff_target = max_chars - len(truncation_notice)
    search_window_start = max(0, cutoff_target - 1000)
    window = text[search_window_start:cutoff_target]

    # Look for last double newline
    last_paragraph = window.rfind("\n\n")
    if last_paragraph != -1:
        split_idx = search_window_start + last_paragraph
    else:
        # Look for last sentence boundary
        last_sentence = window.rfind(". ")
        if last_sentence != -1:
            split_idx = search_window_start + last_sentence + 1
        else:
            # Look for last newline
            last_newline = window.rfind("\n")
            if last_newline != -1:
                split_idx = search_window_start + last_newline
            else:
                split_idx = cutoff_target

    bounded_text = text[:split_idx].rstrip() + truncation_notice
    return bounded_text, True
