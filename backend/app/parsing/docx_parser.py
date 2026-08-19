import io
from docx import Document as DocxDocument

def parse_docx(file_bytes: bytes) -> str:
    try:
        doc_stream = io.BytesIO(file_bytes)
        doc = DocxDocument(doc_stream)
        
        text_content = []
        
        for paragraph in doc.paragraphs:
            if paragraph.text.strip():
                text_content.append(paragraph.text)
                
        for table in doc.tables:
            for row in table.rows:
                row_text = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                if row_text:
                    text_content.append(" | ".join(row_text))
                    
        return "\n".join(text_content).strip()
    except Exception as e:
        raise ValueError(f"Failed to parse DOCX document: {str(e)}")
