# Pytest Testing Patterns

## Table of Contents

1. [Test Setup](#test-setup)
2. [Fixtures](#fixtures)
3. [Auth Tests](#auth-tests)
4. [CRUD Tests](#crud-tests)
5. [Test Utilities](#test-utilities)

## Test Setup

### conftest.py

```python
# tests/conftest.py
import asyncio
from collections.abc import AsyncGenerator
from uuid import uuid4

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession

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
async def test_engine():
    """Create test database engine."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        echo=False,
    )
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def test_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """Create test database session."""
    async with AsyncSession(test_engine) as session:
        yield session


@pytest_asyncio.fixture(scope="function")
async def client(test_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Create test HTTP client with dependency overrides."""

    async def override_get_session():
        yield test_session

    app.dependency_overrides[get_session] = override_get_session

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac

    app.dependency_overrides.clear()
```

## Fixtures

### User Fixtures

```python
@pytest_asyncio.fixture
async def test_user(test_session: AsyncSession) -> User:
    """Create a test user."""
    user = User(
        id=uuid4(),
        email="test@example.com",
        hashed_password=hash_password("testpassword123"),
        is_active=True,
    )
    test_session.add(user)
    await test_session.commit()
    await test_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def auth_headers(test_user: User) -> dict[str, str]:
    """Create auth headers for test user."""
    token = create_access_token(data={"sub": str(test_user.id)})
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def other_user(test_session: AsyncSession) -> User:
    """Create another test user for isolation tests."""
    user = User(
        id=uuid4(),
        email="other@example.com",
        hashed_password=hash_password("otherpassword123"),
        is_active=True,
    )
    test_session.add(user)
    await test_session.commit()
    await test_session.refresh(user)
    return user
```

### Todo Fixtures

```python
from src.models.todo import Todo


@pytest_asyncio.fixture
async def test_todo(test_session: AsyncSession, test_user: User) -> Todo:
    """Create a test todo."""
    todo = Todo(
        id=uuid4(),
        title="Test Todo",
        description="Test description",
        is_completed=False,
        priority=1,
        user_id=test_user.id,
    )
    test_session.add(todo)
    await test_session.commit()
    await test_session.refresh(todo)
    return todo
```

## Auth Tests

```python
# tests/test_auth.py
import pytest
from httpx import AsyncClient


class TestAuth:
    @pytest.mark.asyncio
    async def test_register_success(self, client: AsyncClient):
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "newuser@example.com",
                "password": "securepassword123",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    @pytest.mark.asyncio
    async def test_register_duplicate_email(
        self, client: AsyncClient, test_user: User
    ):
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": test_user.email,
                "password": "anypassword123",
            },
        )
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_login_success(self, client: AsyncClient, test_user: User):
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": test_user.email,
                "password": "testpassword123",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data

    @pytest.mark.asyncio
    async def test_login_wrong_password(self, client: AsyncClient, test_user: User):
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": test_user.email,
                "password": "wrongpassword",
            },
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_protected_route_without_token(self, client: AsyncClient):
        response = await client.get("/api/v1/todos/")
        assert response.status_code == 403  # No auth header

    @pytest.mark.asyncio
    async def test_protected_route_with_invalid_token(self, client: AsyncClient):
        response = await client.get(
            "/api/v1/todos/",
            headers={"Authorization": "Bearer invalidtoken"},
        )
        assert response.status_code == 401
```

## CRUD Tests

```python
# tests/test_todos.py
import pytest
from httpx import AsyncClient

from src.models.todo import Todo
from src.models.user import User


class TestTodos:
    @pytest.mark.asyncio
    async def test_create_todo(
        self, client: AsyncClient, auth_headers: dict[str, str]
    ):
        response = await client.post(
            "/api/v1/todos/",
            headers=auth_headers,
            json={
                "title": "New Todo",
                "description": "Description",
                "priority": 2,
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "New Todo"
        assert data["is_completed"] is False

    @pytest.mark.asyncio
    async def test_list_todos(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        test_todo: Todo,
    ):
        response = await client.get(
            "/api/v1/todos/",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert any(t["id"] == str(test_todo.id) for t in data)

    @pytest.mark.asyncio
    async def test_get_todo(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        test_todo: Todo,
    ):
        response = await client.get(
            f"/api/v1/todos/{test_todo.id}",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(test_todo.id)
        assert data["title"] == test_todo.title

    @pytest.mark.asyncio
    async def test_update_todo(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        test_todo: Todo,
    ):
        response = await client.patch(
            f"/api/v1/todos/{test_todo.id}",
            headers=auth_headers,
            json={"title": "Updated Title", "is_completed": True},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated Title"
        assert data["is_completed"] is True

    @pytest.mark.asyncio
    async def test_delete_todo(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        test_todo: Todo,
    ):
        response = await client.delete(
            f"/api/v1/todos/{test_todo.id}",
            headers=auth_headers,
        )
        assert response.status_code == 204

        # Verify deleted
        response = await client.get(
            f"/api/v1/todos/{test_todo.id}",
            headers=auth_headers,
        )
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_user_isolation(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        other_user: User,
        test_session,
    ):
        """Test that users cannot access other users' todos."""
        from uuid import uuid4
        # Create todo for other user
        other_todo = Todo(
            id=uuid4(),
            title="Other's Todo",
            user_id=other_user.id,
        )
        test_session.add(other_todo)
        await test_session.commit()

        # Try to access with first user's token
        response = await client.get(
            f"/api/v1/todos/{other_todo.id}",
            headers=auth_headers,
        )
        assert response.status_code == 404
```

## Test Utilities

### Factory Functions

```python
# tests/factories.py
from uuid import uuid4

from src.models.todo import Todo
from src.models.user import User
from src.services.auth import hash_password


def create_user(
    email: str = "test@example.com",
    password: str = "testpassword123",
    is_active: bool = True,
) -> User:
    return User(
        id=uuid4(),
        email=email,
        hashed_password=hash_password(password),
        is_active=is_active,
    )


def create_todo(
    user_id,
    title: str = "Test Todo",
    description: str | None = None,
    is_completed: bool = False,
    priority: int = 0,
) -> Todo:
    return Todo(
        id=uuid4(),
        title=title,
        description=description,
        is_completed=is_completed,
        priority=priority,
        user_id=user_id,
    )
```

### Pytest Configuration

```toml
# pyproject.toml
[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
python_files = ["test_*.py"]
python_functions = ["test_*"]
addopts = "-v --tb=short"
filterwarnings = [
    "ignore::DeprecationWarning",
]
```
