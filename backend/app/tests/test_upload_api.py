import io
import unittest
import pymupdf as fitz
from docx import Document as DocxDocument
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.session import Base, get_db

# Use an in-memory SQLite database for fast and isolated test execution
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


class TestUploadAPI(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        Base.metadata.drop_all(bind=engine)

    def test_upload_valid_txt(self):
        txt_content = b"ReqFlow Project Specification:\n1. User Authentication\n2. AI Backlog Generation."
        response = self.client.post(
            "/documents/upload",
            files={"file": ("requirements.txt", txt_content, "text/plain")}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["filename"], "requirements.txt")
        self.assertIn("ReqFlow Project Specification", data["extracted_text"])
        self.assertIn("id", data)

        # Verify get_document
        doc_id = data["id"]
        get_resp = self.client.get(f"/documents/{doc_id}")
        self.assertEqual(get_resp.status_code, 200)
        self.assertEqual(get_resp.json()["id"], doc_id)

    def test_upload_valid_pdf(self):
        doc = fitz.open()
        page = doc.new_page()
        page.insert_text((50, 50), "ReqFlow PDF Integration Test Content for Agile Requirements.")
        pdf_bytes = doc.tobytes()
        doc.close()

        response = self.client.post(
            "/documents/upload",
            files={"file": ("spec.pdf", pdf_bytes, "application/pdf")}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["filename"], "spec.pdf")
        self.assertIn("ReqFlow PDF Integration Test", data["extracted_text"])

    def test_upload_valid_docx(self):
        doc = DocxDocument()
        doc.add_paragraph("ReqFlow Word Specification for user stories.")
        buf = io.BytesIO()
        doc.save(buf)
        docx_bytes = buf.getvalue()

        response = self.client.post(
            "/documents/upload",
            files={"file": ("spec.docx", docx_bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["filename"], "spec.docx")
        self.assertIn("ReqFlow Word Specification", data["extracted_text"])

    def test_upload_spoofed_pdf_fails_magic_bytes(self):
        # Plain text disguised as a PDF
        fake_pdf = b"This is plain text pretending to be a PDF."
        response = self.client.post(
            "/documents/upload",
            files={"file": ("fake.pdf", fake_pdf, "application/pdf")}
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("magic byte signature", response.json()["detail"])

    def test_upload_spoofed_docx_fails(self):
        fake_docx = b"PK\x03\x04random-binary-content-not-word"
        response = self.client.post(
            "/documents/upload",
            files={"file": ("corrupt.docx", fake_docx, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("not a valid OpenXML Word document", response.json()["detail"])

    def test_upload_password_protected_pdf(self):
        doc = fitz.open()
        page = doc.new_page()
        page.insert_text((50, 50), "Secret requirements")
        pdf_bytes = doc.tobytes(encryption=fitz.PDF_ENCRYPT_AES_256, user_pw="pwd123", owner_pw="admin")
        doc.close()

        response = self.client.post(
            "/documents/upload",
            files={"file": ("encrypted.pdf", pdf_bytes, "application/pdf")}
        )
        self.assertEqual(response.status_code, 422)
        self.assertIn("password-protected", response.json()["detail"])

    def test_upload_scanned_image_pdf(self):
        doc = fitz.open()
        page = doc.new_page()
        pix = fitz.Pixmap(fitz.csRGB, (0, 0, 30, 30), 0)
        pix.clear_with(150)
        page.insert_image(page.rect, pixmap=pix)
        pdf_bytes = doc.tobytes()
        doc.close()

        response = self.client.post(
            "/documents/upload",
            files={"file": ("scanned.pdf", pdf_bytes, "application/pdf")}
        )
        self.assertEqual(response.status_code, 422)
        self.assertIn("Scanned PDF document detected", response.json()["detail"])

    def test_upload_empty_document(self):
        response = self.client.post(
            "/documents/upload",
            files={"file": ("empty.txt", b"   \n\n  \t  ", "text/plain")}
        )
        self.assertEqual(response.status_code, 422)
        self.assertIn("no readable text", response.json()["detail"].lower())

    def test_get_nonexistent_document(self):
        import uuid
        random_id = uuid.uuid4()
        response = self.client.get(f"/documents/{random_id}")
        self.assertEqual(response.status_code, 404)


if __name__ == "__main__":
    unittest.main()
