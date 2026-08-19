import fitz  # PyMuPDF

def parse_pdf(file_bytes: bytes) -> str:
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        text_content = []
        for page in doc:
            text_content.append(page.get_text())
        doc.close()
        return "\n".join(text_content).strip()
    except Exception as e:
        raise ValueError(f"Failed to parse PDF document: {str(e)}")
