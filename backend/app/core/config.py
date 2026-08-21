from pydantic_settings import BaseSettings
from pydantic import ConfigDict, field_validator


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://reqflow_user:reqflow_password@localhost:5432/reqflow"
    OPENAI_API_KEY: str = "your_openai_api_key_here"
    OPENAI_BASE_URL: str = "https://api.openai.com/v1"
    OPENAI_MODEL: str = "openai/gpt-oss-120b"
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    GITHUB_TOKEN: str = ""
    PORT: int = 8000
    MAX_DOCUMENT_CHARS: int = 150000
    MAX_DOCUMENT_SIZE_MB: int = 20

    @field_validator(
        "DATABASE_URL",
        "OPENAI_API_KEY",
        "OPENAI_MODEL",
        "GROQ_API_KEY",
        "GROQ_MODEL",
        "GITHUB_TOKEN",
        mode="before"
    )
    @classmethod
    def strip_string_fields(cls, v: str) -> str:
        if isinstance(v, str):
            return v.strip()
        return v

    @field_validator("OPENAI_BASE_URL", mode="before")
    @classmethod
    def sanitize_base_url(cls, v: str) -> str:
        if isinstance(v, str):
            cleaned = v.strip()
            return cleaned.rstrip("/")
        return v

    @field_validator("PORT", mode="before")
    @classmethod
    def validate_port(cls, v: int) -> int:
        if isinstance(v, (int, str)):
            val = int(v)
            if not (1 <= val <= 65535):
                raise ValueError("PORT must be between 1 and 65535")
            return val
        return v

    @field_validator("DATABASE_URL")
    @classmethod
    def validate_database_url(cls, v: str) -> str:
        if not v or not (v.startswith("sqlite") or v.startswith("postgresql") or v.startswith("postgres")):
            raise ValueError("DATABASE_URL must be a valid sqlite or postgresql connection string")
        return v

    model_config = ConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()

