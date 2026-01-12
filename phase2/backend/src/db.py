"""Database connection and session management."""

from collections.abc import Generator

from sqlmodel import Session, SQLModel, create_engine

from .config import settings

# Create database engine
# For PostgreSQL (Neon), add pool settings for serverless
engine = create_engine(
    settings.database_url,
    echo=settings.debug,
    connect_args=(
        {"check_same_thread": False}
        if settings.database_url.startswith("sqlite")
        else {}
    ),
)


def create_db_and_tables() -> None:
    """Create all database tables. Use for development only."""
    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    """Dependency that provides a database session."""
    with Session(engine) as session:
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise
