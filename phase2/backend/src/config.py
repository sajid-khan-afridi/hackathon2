"""Application settings and configuration."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Application
    app_name: str = "Todo API"
    debug: bool = False

    # Database
    database_url: str = "sqlite:///./test.db"

    # Authentication (Better Auth shared secret)
    better_auth_secret: str = "development-secret-key-min-32-chars"
    jwt_algorithm: str = "HS256"

    # Server
    host: str = "0.0.0.0"
    port: int = 8000

    # CORS
    allowed_origins: str = "http://localhost:3000"

    # Frontend URL (for JWKS endpoint)
    frontend_url: str = "http://localhost:3000"

    @property
    def cors_origins(self) -> list[str]:
        """Parse CORS origins from comma-separated string."""
        return [origin.strip() for origin in self.allowed_origins.split(",")]


settings = Settings()
