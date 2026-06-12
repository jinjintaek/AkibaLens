from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    backend_cors_origins: str = "http://localhost:3000"
    openai_api_key: str | None = None
    openai_model: str = "gpt-4.1-mini"
    openai_search_model: str | None = None
    openai_image_detail: str = "auto"
    openai_identification_web_search: bool = False
    candidate_reranking_enabled: bool = True
    gemini_api_key: str | None = None
    search_provider: str = "duckduckgo"
    google_search_api_key: str | None = None
    google_search_engine_id: str | None = None
    search_result_limit: int = 5
    database_url: str | None = None

    model_config = SettingsConfigDict(
        env_file=("../.env", ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def cors_origins(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.backend_cors_origins.split(",")
            if origin.strip()
        ]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
