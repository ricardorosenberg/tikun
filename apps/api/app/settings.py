from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    database_url: str = "sqlite:///./tikun.db"
    jwt_secret: str = "dev-secret-change"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7
    supabase_jwt_secret: str | None = None
    cors_origins: List[str] = ["http://localhost:3000"]
    max_upload_mb: int = 4
    rate_limit_per_minute: int = 30
    embedding_backend: str = "yamnet"

    class Config:
        env_prefix = "TIKUN_"
        env_file = ".env"


settings = Settings()
