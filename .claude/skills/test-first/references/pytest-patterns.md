# Pytest Patterns for FastAPI Backend

## Table of Contents

1. [Core Fixtures](#core-fixtures)
2. [Database Test Isolation](#database-test-isolation)
3. [Authentication Fixtures](#authentication-fixtures)
4. [CRUD Test Patterns](#crud-test-patterns)
5. [Error Path Testing](#error-path-testing)
6. [Async Testing](#async-testing)

## Core Fixtures

### conftest.py Setup

```python
# tests/conftest.py
import asyncio
from collections.abc import AsyncGenerator
from typing import Any

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel

from src.config import settings
from src.database import get_session
from src.main import app
from src.models.user import User
from src.services.auth import create_access_token, hash_password


# Use in-memory SQLite for tests
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="function")
async def async_engine():
    """Create async engine for each test."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        echo=False,
        future=True,
    )
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def session(async_engine) -> AsyncGenerator[AsyncSession, None]:
    """Create async session for each test."""
    async_session = sessionmaker(
        async_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    async with async_session() as session:
        yield session


@pytest_asyncio.fixture(scope="function")
async def client(session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Create test client with session override."""
    async def override_get_session():
        yield session

    app.dependency_overrides[get_session] = override_get_session

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        yield client

    app.dependency_overrides.clear()
```

## Database Test Isolation

### Per-Test Database Reset

```python
@pytest_asyncio.fixture(scope="function", autouse=True)
async def reset_database(async_engine):
    """Reset database state before each test."""
    async with async_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)
        await conn.run_sync(SQLModel.metadata.create_all)
```

### Factory Fixtures

```python
@pytest_asyncio.fixture
async def create_user(session: AsyncSession):
    """Factory fixture to create test users."""
    async def _create_user(
        email: str = "test@example.com",
        password: str = "testpassword123",
        **kwargs: Any,
    ) -> User:
        user = User(
            email=email,
            hashed_password=hash_password(password),
            **kwargs,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        return user

    return _create_user


@pytest_asyncio.fixture
async def user(create_user) -> User:
    """Create a default test user."""
    return await create_user()
```

## Authentication Fixtures

### Auth Token Fixture

```python
@pytest_asyncio.fixture
async def auth_headers(user: User) -> dict[str, str]:
    """Generate auth headers for authenticated requests."""
    token = create_access_token(data={"sub": str(user.id)})
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def auth_client(
    client: AsyncClient,
    auth_headers: dict[str, str],
) -> AsyncClient:
    """Client with auth headers pre-configured."""
    client.headers.update(auth_headers)
    return client
```

### Multi-User Testing

```python
@pytest_asyncio.fixture
async def other_user(create_user) -> User:
    """Create a second user for isolation testing."""
    return await create_user(email="other@example.com")


@pytest_asyncio.fixture
async def other_auth_headers(other_user: User) -> dict[str, str]:
    """Auth headers for the other user."""
    token = create_access_token(data={"sub": str(other_user.id)})
    return {"Authorization": f"Bearer {token}"}
```

## CRUD Test Patterns

### Create Tests

```python
class TestCreateTodo:
    async def test_create_todo_success(
        self,
        client: AsyncClient,
        auth_headers: dict,
    ):
        response = await client.post(
            "/api/v1/todos",
            json={"title": "Test todo", "description": "Test desc"},
            headers=auth_headers,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Test todo"
        assert "id" in data

    async def test_create_todo_unauthenticated(
        self,
        client: AsyncClient,
    ):
        response = await client.post(
            "/api/v1/todos",
            json={"title": "Test todo"},
        )
        assert response.status_code == 401

    async def test_create_todo_invalid_data(
        self,
        client: AsyncClient,
        auth_headers: dict,
    ):
        response = await client.post(
            "/api/v1/todos",
            json={"title": ""},  # Empty title
            headers=auth_headers,
        )
        assert response.status_code == 422
```

### Read Tests

```python
class TestGetTodos:
    async def test_get_todos_empty(
        self,
        client: AsyncClient,
        auth_headers: dict,
    ):
        response = await client.get(
            "/api/v1/todos",
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json() == []

    async def test_get_todos_returns_only_user_todos(
        self,
        client: AsyncClient,
        auth_headers: dict,
        other_auth_headers: dict,
    ):
        # Create todo for current user
        await client.post(
            "/api/v1/todos",
            json={"title": "My todo"},
            headers=auth_headers,
        )
        # Create todo for other user
        await client.post(
            "/api/v1/todos",
            json={"title": "Other todo"},
            headers=other_auth_headers,
        )

        # Get current user's todos
        response = await client.get(
            "/api/v1/todos",
            headers=auth_headers,
        )
        todos = response.json()
        assert len(todos) == 1
        assert todos[0]["title"] == "My todo"
```

### Update Tests

```python
class TestUpdateTodo:
    async def test_update_todo_success(
        self,
        client: AsyncClient,
        auth_headers: dict,
    ):
        # Create
        create_resp = await client.post(
            "/api/v1/todos",
            json={"title": "Original"},
            headers=auth_headers,
        )
        todo_id = create_resp.json()["id"]

        # Update
        response = await client.patch(
            f"/api/v1/todos/{todo_id}",
            json={"title": "Updated"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["title"] == "Updated"

    async def test_update_other_user_todo_forbidden(
        self,
        client: AsyncClient,
        auth_headers: dict,
        other_auth_headers: dict,
    ):
        # Create with other user
        create_resp = await client.post(
            "/api/v1/todos",
            json={"title": "Other's todo"},
            headers=other_auth_headers,
        )
        todo_id = create_resp.json()["id"]

        # Try to update with current user
        response = await client.patch(
            f"/api/v1/todos/{todo_id}",
            json={"title": "Hacked"},
            headers=auth_headers,
        )
        assert response.status_code == 404  # Should not find it
```

### Delete Tests

```python
class TestDeleteTodo:
    async def test_delete_todo_success(
        self,
        client: AsyncClient,
        auth_headers: dict,
    ):
        # Create
        create_resp = await client.post(
            "/api/v1/todos",
            json={"title": "To delete"},
            headers=auth_headers,
        )
        todo_id = create_resp.json()["id"]

        # Delete
        response = await client.delete(
            f"/api/v1/todos/{todo_id}",
            headers=auth_headers,
        )
        assert response.status_code == 204

        # Verify deleted
        get_resp = await client.get(
            f"/api/v1/todos/{todo_id}",
            headers=auth_headers,
        )
        assert get_resp.status_code == 404
```

## Error Path Testing

### Not Found

```python
async def test_get_nonexistent_todo(
    client: AsyncClient,
    auth_headers: dict,
):
    fake_id = "00000000-0000-0000-0000-000000000000"
    response = await client.get(
        f"/api/v1/todos/{fake_id}",
        headers=auth_headers,
    )
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()
```

### Validation Errors

```python
async def test_create_todo_title_too_long(
    client: AsyncClient,
    auth_headers: dict,
):
    response = await client.post(
        "/api/v1/todos",
        json={"title": "x" * 256},  # Exceeds max length
        headers=auth_headers,
    )
    assert response.status_code == 422
```

### Auth Errors

```python
async def test_expired_token(client: AsyncClient):
    expired_token = create_access_token(
        data={"sub": "user-id"},
        expires_delta=timedelta(seconds=-1),  # Already expired
    )
    response = await client.get(
        "/api/v1/todos",
        headers={"Authorization": f"Bearer {expired_token}"},
    )
    assert response.status_code == 401
```

## Async Testing

### Pytest-Asyncio Configuration

```toml
# pyproject.toml
[tool.pytest.ini_options]
asyncio_mode = "auto"
asyncio_default_fixture_loop_scope = "function"
```

### Async Context Managers

```python
@pytest_asyncio.fixture
async def db_with_data(session: AsyncSession):
    """Fixture that sets up and tears down test data."""
    # Setup
    user = User(email="test@example.com", hashed_password="hash")
    session.add(user)
    await session.commit()

    yield session

    # Teardown (optional - handled by transaction rollback)
    await session.rollback()
```

### Parallel Test Execution

```bash
# Run tests in parallel with pytest-xdist
uv run pytest -n auto --dist loadgroup

# Group tests that share database state
@pytest.mark.xdist_group("db_intensive")
class TestDatabaseHeavy:
    ...
```
