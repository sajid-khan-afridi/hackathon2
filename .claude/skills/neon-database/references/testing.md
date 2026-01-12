# Database Testing Patterns

Comprehensive testing strategies for database operations.

## Test Database Strategy

### Use SQLite for Unit Tests

SQLite provides fast, isolated tests without external dependencies:

```python
# tests/conftest.py
import pytest
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool
from sqlmodel import SQLModel

# Import all models to register metadata
from src.models import Task  # noqa: F401

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestSessionLocal = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)
```

### Use Neon Branch for Integration Tests

```python
# tests/conftest_integration.py
import os

import pytest

# Only run integration tests when flag is set
INTEGRATION_TESTS = os.getenv("RUN_INTEGRATION_TESTS", "false").lower() == "true"

pytestmark = pytest.mark.skipif(
    not INTEGRATION_TESTS,
    reason="Integration tests disabled",
)


@pytest.fixture(scope="session")
async def integration_engine():
    """Use Neon test branch for integration tests."""
    from sqlalchemy.ext.asyncio import create_async_engine
    from sqlalchemy.pool import NullPool

    url = os.environ["TEST_DATABASE_URL"]  # Neon branch URL
    engine = create_async_engine(url, poolclass=NullPool)

    yield engine

    await engine.dispose()
```

## Fixtures

### Database Session Fixture

```python
@pytest.fixture(scope="function")
async def session() -> AsyncGenerator[AsyncSession, None]:
    """
    Provide a clean database session for each test.
    Creates tables before test, drops after.
    """
    # Create all tables
    async with test_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

    # Provide session
    async with TestSessionLocal() as session:
        yield session

    # Drop all tables (clean slate for next test)
    async with test_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)
```

### Test User Fixture

```python
@pytest.fixture
def test_user() -> dict:
    """Standard test user."""
    return {
        "id": "test-user-123",
        "email": "test@example.com",
        "name": "Test User",
    }


@pytest.fixture
def other_user() -> dict:
    """Different user for isolation tests."""
    return {
        "id": "other-user-456",
        "email": "other@example.com",
        "name": "Other User",
    }
```

### Test Data Fixtures

```python
from src.models import Task


@pytest.fixture
async def sample_task(session: AsyncSession, test_user: dict) -> Task:
    """Create a single task for testing."""
    task = Task(
        title="Sample Task",
        description="Sample description",
        user_id=test_user["id"],
    )
    session.add(task)
    await session.commit()
    await session.refresh(task)
    return task


@pytest.fixture
async def sample_tasks(session: AsyncSession, test_user: dict) -> list[Task]:
    """Create multiple tasks for list testing."""
    tasks = [
        Task(title="Task 1", user_id=test_user["id"]),
        Task(title="Task 2", user_id=test_user["id"], completed=True),
        Task(title="Task 3", description="With description", user_id=test_user["id"]),
    ]
    for task in tasks:
        session.add(task)
    await session.commit()

    for task in tasks:
        await session.refresh(task)
    return tasks
```

### FastAPI Test Client Fixture

```python
@pytest.fixture
async def client(session: AsyncSession, test_user: dict):
    """
    Provide test client with mocked authentication.
    """
    from httpx import ASGITransport, AsyncClient

    from src.main import app
    from src.db import get_session
    from src.auth import get_current_user

    # Override database session
    async def override_get_session():
        yield session

    # Override authentication
    async def override_get_current_user():
        return test_user

    app.dependency_overrides[get_session] = override_get_session
    app.dependency_overrides[get_current_user] = override_get_current_user

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac

    app.dependency_overrides.clear()
```

## Test Patterns

### Model Tests

```python
# tests/test_models.py
import pytest
from datetime import datetime

from src.models import Task


class TestTaskModel:
    """Tests for Task model."""

    def test_create_task_defaults(self):
        """Test task creation with defaults."""
        task = Task(
            title="Test Task",
            user_id="user-123",
        )

        assert task.title == "Test Task"
        assert task.description is None
        assert task.completed is False
        assert task.user_id == "user-123"

    def test_create_task_with_all_fields(self):
        """Test task creation with all fields."""
        task = Task(
            title="Full Task",
            description="Full description",
            user_id="user-123",
            completed=True,
        )

        assert task.title == "Full Task"
        assert task.description == "Full description"
        assert task.completed is True
```

### Service Tests

```python
# tests/test_services.py
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from src.services import task_service
from src.schemas import TaskCreate, TaskUpdate


@pytest.mark.asyncio
class TestTaskService:
    """Tests for task service functions."""

    async def test_create_task(
        self,
        session: AsyncSession,
        test_user: dict,
    ):
        """Test creating a task via service."""
        task_in = TaskCreate(title="New Task")
        task = await task_service.create_task(
            session,
            test_user["id"],
            task_in,
        )

        assert task.id is not None
        assert task.title == "New Task"
        assert task.user_id == test_user["id"]

    async def test_get_task_not_found(
        self,
        session: AsyncSession,
        test_user: dict,
    ):
        """Test getting non-existent task returns None."""
        task = await task_service.get_task(
            session,
            task_id=999,
            user_id=test_user["id"],
        )
        assert task is None

    async def test_user_isolation(
        self,
        session: AsyncSession,
        sample_task,
        other_user: dict,
    ):
        """Test user cannot access other user's task."""
        task = await task_service.get_task(
            session,
            task_id=sample_task.id,
            user_id=other_user["id"],  # Different user
        )
        assert task is None  # Should not find it

    async def test_toggle_task(
        self,
        session: AsyncSession,
        sample_task,
    ):
        """Test toggling task completion."""
        assert sample_task.completed is False

        toggled = await task_service.toggle_task(session, sample_task)
        assert toggled.completed is True

        toggled_again = await task_service.toggle_task(session, toggled)
        assert toggled_again.completed is False

    async def test_list_filtered_tasks(
        self,
        session: AsyncSession,
        sample_tasks,
        test_user: dict,
    ):
        """Test filtering tasks by completion status."""
        # Get completed only
        completed = await task_service.get_tasks(
            session,
            test_user["id"],
            completed=True,
        )
        assert len(completed) == 1
        assert all(t.completed for t in completed)

        # Get pending only
        pending = await task_service.get_tasks(
            session,
            test_user["id"],
            completed=False,
        )
        assert len(pending) == 2
        assert all(not t.completed for t in pending)
```

### API Tests

```python
# tests/test_api.py
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestTasksAPI:
    """Tests for tasks API endpoints."""

    async def test_create_task(self, client: AsyncClient):
        """Test POST /api/tasks."""
        response = await client.post(
            "/api/tasks",
            json={"title": "API Task", "description": "Via API"},
        )

        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "API Task"
        assert data["description"] == "Via API"
        assert data["completed"] is False
        assert "id" in data

    async def test_create_task_validation(self, client: AsyncClient):
        """Test validation on task creation."""
        # Empty title
        response = await client.post(
            "/api/tasks",
            json={"title": ""},
        )
        assert response.status_code == 422

        # Title too long
        response = await client.post(
            "/api/tasks",
            json={"title": "x" * 201},
        )
        assert response.status_code == 422

    async def test_list_tasks_empty(self, client: AsyncClient):
        """Test GET /api/tasks with no tasks."""
        response = await client.get("/api/tasks")

        assert response.status_code == 200
        assert response.json() == []

    async def test_list_tasks(self, client: AsyncClient, sample_tasks):
        """Test GET /api/tasks with existing tasks."""
        response = await client.get("/api/tasks")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3

    async def test_get_task(self, client: AsyncClient, sample_task):
        """Test GET /api/tasks/{id}."""
        response = await client.get(f"/api/tasks/{sample_task.id}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == sample_task.id
        assert data["title"] == sample_task.title

    async def test_get_task_not_found(self, client: AsyncClient):
        """Test GET /api/tasks/{id} with invalid id."""
        response = await client.get("/api/tasks/999")
        assert response.status_code == 404

    async def test_update_task(self, client: AsyncClient, sample_task):
        """Test PATCH /api/tasks/{id}."""
        response = await client.patch(
            f"/api/tasks/{sample_task.id}",
            json={"title": "Updated Title"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated Title"
        assert data["description"] == sample_task.description  # Unchanged

    async def test_toggle_task(self, client: AsyncClient, sample_task):
        """Test POST /api/tasks/{id}/toggle."""
        # Toggle to completed
        response = await client.post(f"/api/tasks/{sample_task.id}/toggle")
        assert response.status_code == 200
        assert response.json()["completed"] is True

        # Toggle back
        response = await client.post(f"/api/tasks/{sample_task.id}/toggle")
        assert response.json()["completed"] is False

    async def test_delete_task(self, client: AsyncClient, sample_task):
        """Test DELETE /api/tasks/{id}."""
        response = await client.delete(f"/api/tasks/{sample_task.id}")
        assert response.status_code == 204

        # Verify deleted
        response = await client.get(f"/api/tasks/{sample_task.id}")
        assert response.status_code == 404
```

### User Isolation Tests

```python
# tests/test_isolation.py
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestUserIsolation:
    """Tests ensuring proper user data isolation."""

    @pytest.fixture
    async def client_user_a(self, session, test_user):
        """Client authenticated as user A."""
        # ... setup similar to client fixture
        pass

    @pytest.fixture
    async def client_user_b(self, session, other_user):
        """Client authenticated as user B."""
        # ... setup similar to client fixture
        pass

    async def test_cannot_read_others_tasks(
        self,
        client_user_a: AsyncClient,
        client_user_b: AsyncClient,
    ):
        """User B cannot read User A's tasks."""
        # Create task as User A
        response = await client_user_a.post(
            "/api/tasks",
            json={"title": "User A's private task"},
        )
        task_id = response.json()["id"]

        # Try to read as User B
        response = await client_user_b.get(f"/api/tasks/{task_id}")
        assert response.status_code == 404

    async def test_cannot_update_others_tasks(
        self,
        client_user_a: AsyncClient,
        client_user_b: AsyncClient,
    ):
        """User B cannot update User A's tasks."""
        response = await client_user_a.post(
            "/api/tasks",
            json={"title": "Original"},
        )
        task_id = response.json()["id"]

        response = await client_user_b.patch(
            f"/api/tasks/{task_id}",
            json={"title": "Hacked"},
        )
        assert response.status_code == 404

    async def test_cannot_delete_others_tasks(
        self,
        client_user_a: AsyncClient,
        client_user_b: AsyncClient,
    ):
        """User B cannot delete User A's tasks."""
        response = await client_user_a.post(
            "/api/tasks",
            json={"title": "Important task"},
        )
        task_id = response.json()["id"]

        response = await client_user_b.delete(f"/api/tasks/{task_id}")
        assert response.status_code == 404

        # Verify still exists
        response = await client_user_a.get(f"/api/tasks/{task_id}")
        assert response.status_code == 200

    async def test_lists_only_own_tasks(
        self,
        client_user_a: AsyncClient,
        client_user_b: AsyncClient,
    ):
        """Each user sees only their own tasks."""
        # Create tasks for each user
        await client_user_a.post("/api/tasks", json={"title": "A's task 1"})
        await client_user_a.post("/api/tasks", json={"title": "A's task 2"})
        await client_user_b.post("/api/tasks", json={"title": "B's task"})

        # User A should see 2 tasks
        response = await client_user_a.get("/api/tasks")
        assert len(response.json()) == 2

        # User B should see 1 task
        response = await client_user_b.get("/api/tasks")
        assert len(response.json()) == 1
```

## Running Tests

### pytest.ini Configuration

```ini
# pytest.ini
[pytest]
asyncio_mode = auto
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = -v --tb=short
filterwarnings =
    ignore::DeprecationWarning
```

### Commands

```bash
# Run all tests
uv run pytest

# Run with coverage
uv run pytest --cov=src --cov-report=html

# Run specific test file
uv run pytest tests/test_api.py

# Run specific test class
uv run pytest tests/test_api.py::TestTasksAPI

# Run specific test
uv run pytest tests/test_api.py::TestTasksAPI::test_create_task

# Run integration tests (requires TEST_DATABASE_URL)
RUN_INTEGRATION_TESTS=true TEST_DATABASE_URL="..." uv run pytest tests/integration/
```
