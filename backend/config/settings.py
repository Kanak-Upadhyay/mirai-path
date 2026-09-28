"""Environment-backed settings. Secrets are never logged from this module."""

from functools import lru_cache
from typing import Literal

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration loaded from the environment and an optional .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    openai_api_key: SecretStr = Field(default=SecretStr(""))
    gemini_api_key: SecretStr = Field(default=SecretStr(""))
    llm_provider: Literal["openai", "gemini"] = "openai"
    search_api_key: SecretStr = Field(default=SecretStr(""))
    search_provider: str = ""
    database_url: SecretStr = Field(default=SecretStr(""))
    chroma_path: str = "./data/chroma"
    frontend_url: str = "http://localhost:3000"
    backend_url: str = "http://localhost:8000"
    log_level: str = "INFO"

    def secret_configured(self, secret: SecretStr) -> bool:
        """Return whether a secret has a non-empty value, without revealing it."""
        return bool(secret.get_secret_value().strip())


@lru_cache
def get_settings() -> Settings:
    """Return a cached settings instance."""
    return Settings()
