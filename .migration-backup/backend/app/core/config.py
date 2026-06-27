"""Application configuration via environment variables.

All settings are loaded from the environment (and an optional .env file).
Never hard-code secrets — see .env.example for the full list.
"""

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # --- App ---
    app_name: str = "SyncOps AI"
    environment: str = Field(default="development")
    debug: bool = Field(default=True)
    api_v1_prefix: str = "/api"

    # --- Database ---
    # Async SQLAlchemy URL, e.g. postgresql+asyncpg://user:pass@host:5432/db
    database_url: str = Field(
        default="postgresql+asyncpg://syncops:syncops@db:5432/syncops",
    )

    # --- CORS ---
    cors_origins: list[str] = Field(default=["http://localhost:3000"])

    # --- Ingestion auth ---
    # Default demo ingest key; override in production via env.
    ingest_api_key: str = Field(default="dev-ingest-key")

    # --- Gemini (added in later milestones) ---
    gemini_api_key: str = Field(default="")
    gemini_model: str = Field(default="gemini-1.5-flash")
    gemini_rca_model: str = Field(default="gemini-1.5-pro")
    gemini_embedding_model: str = Field(default="text-embedding-004")
    embedding_dim: int = Field(default=768)

    # --- Scheduler ---
    alert_eval_interval_seconds: int = Field(default=60)

    @property
    def sync_database_url(self) -> str:
        """Sync URL for Alembic migrations (psycopg2)."""
        return self.database_url.replace("+asyncpg", "")


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
