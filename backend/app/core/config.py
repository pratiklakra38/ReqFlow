# pyrefly: ignore [missing-import]
from pydantic_settings import BaseSettings
# pyrefly: ignore [missing-import]
from pydantic import ConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://reqflow_user:reqflow_password@localhost:5432/reqflow"
    OPENAI_API_KEY: str = "your_openai_api_key_here"
    OPENAI_BASE_URL: str = "https://api.openai.com/v1"
    GITHUB_TOKEN: str = ""
    PORT: int = 8000

    model_config = ConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
