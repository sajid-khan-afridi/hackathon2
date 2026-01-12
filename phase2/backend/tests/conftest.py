"""Pytest fixtures for backend tests."""

from collections.abc import Generator
from typing import Any

import jwt
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from src.auth import AuthUser, get_current_user
from src.config import settings
from src.db import get_session
from src.main import app
from src.models import Task  # noqa: F401 - Import to register model


# Use SQLite for tests (fast, no external deps)
TEST_DATABASE_URL = "sqlite://"

# Store the current test user for the mock
_test_user_override: dict[str, Any] | None = None


def create_mock_auth_user() -> AuthUser:
    """Create a mock auth user from the test user data."""
    if _test_user_override is None:
        raise ValueError("Test user not set")
    return AuthUser(
        id=_test_user_override["id"],
        email=_test_user_override["email"],
        name=_test_user_override.get("name"),
    )


@pytest.fixture(name="session")
def session_fixture() -> Generator[Session, None, None]:
    """Create a fresh database session for each test."""
    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
        yield session

    SQLModel.metadata.drop_all(engine)


@pytest.fixture(name="client")
def client_fixture(session: Session) -> Generator[TestClient, None, None]:
    """Create a test client with overridden dependencies."""

    def get_session_override() -> Generator[Session, None, None]:
        yield session

    app.dependency_overrides[get_session] = get_session_override

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture
def test_user() -> dict[str, Any]:
    """Return a test user payload."""
    return {
        "id": "test-user-123",
        "email": "test@example.com",
        "name": "Test User",
    }


@pytest.fixture
def auth_headers(test_user: dict[str, Any]) -> dict[str, str]:
    """Generate auth headers with a valid JWT token for testing."""
    token = jwt.encode(
        {
            "sub": test_user["id"],
            "email": test_user["email"],
            "name": test_user["name"],
        },
        settings.better_auth_secret,
        algorithm=settings.jwt_algorithm,
    )

    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def authenticated_client(
    session: Session, test_user: dict[str, Any]
) -> Generator[TestClient, None, None]:
    """Create a test client with mocked authentication.

    This fixture overrides the auth dependency to bypass JWKS verification,
    using the test_user directly as the authenticated user.
    """
    global _test_user_override
    _test_user_override = test_user

    def get_session_override() -> Generator[Session, None, None]:
        yield session

    def get_current_user_override() -> AuthUser:
        return create_mock_auth_user()

    app.dependency_overrides[get_session] = get_session_override
    app.dependency_overrides[get_current_user] = get_current_user_override

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
    _test_user_override = None
