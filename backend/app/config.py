import os
from functools import lru_cache
from typing import List, Optional, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "Emotional Well-Being Assistant API"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    # Database: Supabase PostgreSQL (asyncpg driver)
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/ai_wellbeing_db"

    # CORS Settings
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # Gemini AI Engine Configuration
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-3.1-flash-lite"

    # Token & Context Budget Protection Limits
    CHAT_MAX_HISTORY_MESSAGES: int = 15
    CHAT_MAX_CHECKINS: int = 10
    CHAT_MAX_JOURNAL_ENTRIES: int = 5
    CHAT_MAX_JOURNAL_CHARS: int = 500
    CHAT_MAX_CONTEXT_CHARS: int = 8000
    CHAT_MAX_OUTPUT_TOKENS: int = 1024
    CHAT_MAX_USER_MESSAGE_CHARS: int = 2000

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def normalize_database_url(cls, value: str) -> str:
        if not value:
            return value
        # Normalize standard postgres/postgresql URI to use asyncpg driver
        if value.startswith("postgres://"):
            value = value.replace("postgres://", "postgresql+asyncpg://", 1)
        elif value.startswith("postgresql://"):
            value = value.replace("postgresql://", "postgresql+asyncpg://", 1)
        return value

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: Union[str, List[str]]) -> List[str]:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
