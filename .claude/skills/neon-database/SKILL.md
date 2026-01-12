---
name: neon-database
description: "Neon Serverless PostgreSQL database skill for Todo Full-Stack application. Use when: (1) Setting up database connections with SQLModel, (2) Creating database schemas and migrations, (3) Configuring connection pooling, (4) Writing efficient queries with user data isolation, (5) Managing database sessions in FastAPI, (6) Setting up test databases with SQLite. Covers Neon PostgreSQL, SQLModel, connection pooling, and migration patterns."
---

# Neon Database Skill

Build production-ready database layers with Neon Serverless PostgreSQL, SQLModel ORM, and FastAPI integration.

## Quick Reference

| Task | Pattern |
|------|---------|
| Connection string | `postgresql+asyncpg://user:pass@host/db?sslmode=require` |
| Pooled connection | Use Neon's pooler endpoint (`-pooler` suffix) |
| Direct connection | Use direct endpoint for migrations |
| Session dependency | `async with get_session() as session` |
| User isolation | `WHERE user_id = :user_id` on every query |
| Test database | SQLite with `sqlite+aiosqlite:///:memory:` |

## Connection Setup

### Environment Variables

```bash
# .env
# Pooled connection (for application queries) - use -pooler endpoint
DATABASE_URL="postgresql+asyncpg://user:password@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require"

# Direct connection (for migrations) - use direct endpoint
DATABASE_URL_DIRECT="postgresql+asyncpg://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"

# Test database (SQLite for fast local tests)
DATABASE_URL_TEST="sqlite+aiosqlite:///:memory:"
```

### Configuration Module

```python
# src/config.py
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Database
    database_url: str
    database_url_direct: str | None = None  # For migrations
    database_pool_size: int = 5
    database_max_overflow: int = 10
    database_pool_timeout: int = 30

    # For Neon serverless
    database_pool_pre_ping: bool = True  # Verify connections before use

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
```

### Database Connection Module

```python
# src/db.py
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool
from sqlmodel import SQLModel

from .config import settings

# Create async engine with connection pooling
# Use NullPool for serverless (Neon handles pooling via pgbouncer)
engine = create_async_engine(
    settings.database_url,
    echo=False,  # Set True for SQL logging in development
    poolclass=NullPool,  # Let Neon handle pooling
    connect_args={
        "ssl": "require",  # Required for Neon
    },
)

# Session factory
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def create_db_and_tables() -> None:
    """Create all database tables. Use for development only."""
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """Dependency that provides a database session."""
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


@asynccontextmanager
async def get_session_context() -> AsyncGenerator[AsyncSession, None]:
    """Context manager for database sessions outside of FastAPI."""
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
```

## SQLModel Integration

### Base Model Pattern

```python
# src/models.py
from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class TimestampMixin(SQLModel):
    """Mixin for created_at and updated_at timestamps."""

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class TaskBase(SQLModel):
    """Base task fields shared between create/update/response schemas."""

    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=2000)


class Task(TaskBase, TimestampMixin, table=True):
    """Database table model for tasks."""

    __tablename__ = "tasks"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)  # Foreign key to Better Auth user
    completed: bool = Field(default=False, index=True)

    class Config:
        # Enable relationship loading
        orm_mode = True
```

### Request/Response Schemas

```python
# src/schemas.py
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class TaskCreate(BaseModel):
    """Schema for creating a new task."""

    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=2000)


class TaskUpdate(BaseModel):
    """Schema for updating a task (partial update)."""

    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=2000)


class TaskResponse(BaseModel):
    """Schema for task API responses."""

    id: int
    title: str
    description: Optional[str]
    completed: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
```

## User Data Isolation

**CRITICAL**: Always filter queries by `user_id` to ensure data isolation.

### Query Patterns

```python
# src/services/task_service.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from ..models import Task
from ..schemas import TaskCreate, TaskUpdate


async def get_tasks(
    session: AsyncSession,
    user_id: str,
    *,
    completed: bool | None = None,
    skip: int = 0,
    limit: int = 100,
) -> list[Task]:
    """Get all tasks for a user with optional filtering."""
    statement = select(Task).where(Task.user_id == user_id)

    if completed is not None:
        statement = statement.where(Task.completed == completed)

    statement = statement.offset(skip).limit(limit)
    result = await session.exec(statement)
    return list(result.all())


async def get_task(
    session: AsyncSession,
    task_id: int,
    user_id: str,
) -> Task | None:
    """Get a single task by ID with ownership verification."""
    statement = select(Task).where(
        Task.id == task_id,
        Task.user_id == user_id,  # CRITICAL: Always filter by user_id
    )
    result = await session.exec(statement)
    return result.first()


async def create_task(
    session: AsyncSession,
    user_id: str,
    task_in: TaskCreate,
) -> Task:
    """Create a new task for a user."""
    task = Task(
        **task_in.model_dump(),
        user_id=user_id,
    )
    session.add(task)
    await session.commit()
    await session.refresh(task)
    return task


async def update_task(
    session: AsyncSession,
    task: Task,
    task_in: TaskUpdate,
) -> Task:
    """Update an existing task."""
    update_data = task_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(task, field, value)

    task.updated_at = datetime.utcnow()
    session.add(task)
    await session.commit()
    await session.refresh(task)
    return task


async def toggle_task(
    session: AsyncSession,
    task: Task,
) -> Task:
    """Toggle task completion status."""
    task.completed = not task.completed
    task.updated_at = datetime.utcnow()
    session.add(task)
    await session.commit()
    await session.refresh(task)
    return task


async def delete_task(
    session: AsyncSession,
    task: Task,
) -> None:
    """Delete a task (hard delete)."""
    await session.delete(task)
    await session.commit()
```

### FastAPI Route Integration

```python
# src/routes/tasks.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth import get_current_user
from ..db import get_session
from ..schemas import TaskCreate, TaskResponse, TaskUpdate
from ..services import task_service

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("", response_model=list[TaskResponse])
async def list_tasks(
    session: AsyncSession = Depends(get_session),
    user: dict = Depends(get_current_user),
    completed: bool | None = None,
    skip: int = 0,
    limit: int = 100,
):
    """List all tasks for the authenticated user."""
    tasks = await task_service.get_tasks(
        session,
        user["id"],
        completed=completed,
        skip=skip,
        limit=limit,
    )
    return tasks


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: int,
    session: AsyncSession = Depends(get_session),
    user: dict = Depends(get_current_user),
):
    """Get a specific task by ID."""
    task = await task_service.get_task(session, task_id, user["id"])
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )
    return task


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_in: TaskCreate,
    session: AsyncSession = Depends(get_session),
    user: dict = Depends(get_current_user),
):
    """Create a new task."""
    task = await task_service.create_task(session, user["id"], task_in)
    return task


@router.patch("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int,
    task_in: TaskUpdate,
    session: AsyncSession = Depends(get_session),
    user: dict = Depends(get_current_user),
):
    """Update an existing task."""
    task = await task_service.get_task(session, task_id, user["id"])
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )
    return await task_service.update_task(session, task, task_in)


@router.post("/{task_id}/toggle", response_model=TaskResponse)
async def toggle_task(
    task_id: int,
    session: AsyncSession = Depends(get_session),
    user: dict = Depends(get_current_user),
):
    """Toggle task completion status."""
    task = await task_service.get_task(session, task_id, user["id"])
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )
    return await task_service.toggle_task(session, task)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: int,
    session: AsyncSession = Depends(get_session),
    user: dict = Depends(get_current_user),
):
    """Delete a task."""
    task = await task_service.get_task(session, task_id, user["id"])
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )
    await task_service.delete_task(session, task)
```

## Test Database Setup

### SQLite for Fast Tests

```python
# tests/conftest.py
import pytest
from collections.abc import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool
from sqlmodel import SQLModel

from src.main import app
from src.db import get_session
from src.models import Task  # Import all models to register them


# Use SQLite for tests (fast, no external deps)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,  # Share single connection across threads
)

TestSessionLocal = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


@pytest.fixture(scope="function")
async def test_session() -> AsyncGenerator[AsyncSession, None]:
    """Create a fresh database for each test."""
    async with test_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

    async with TestSessionLocal() as session:
        yield session

    async with test_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)


@pytest.fixture(scope="function")
async def client(test_session: AsyncSession):
    """Create a test client with overridden dependencies."""
    from httpx import ASGITransport, AsyncClient

    async def override_get_session():
        yield test_session

    app.dependency_overrides[get_session] = override_get_session

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture
def test_user() -> dict:
    """Return a test user payload."""
    return {
        "id": "test-user-123",
        "email": "test@example.com",
        "name": "Test User",
    }
```

### Test Examples

```python
# tests/test_tasks.py
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_task(client: AsyncClient, test_user: dict, mocker):
    """Test creating a new task."""
    # Mock authentication
    mocker.patch("src.auth.get_current_user", return_value=test_user)

    response = await client.post(
        "/api/tasks",
        json={"title": "Test task", "description": "Test description"},
    )

    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Test task"
    assert data["description"] == "Test description"
    assert data["completed"] is False
    assert "id" in data


@pytest.mark.asyncio
async def test_list_tasks_empty(client: AsyncClient, test_user: dict, mocker):
    """Test listing tasks when none exist."""
    mocker.patch("src.auth.get_current_user", return_value=test_user)

    response = await client.get("/api/tasks")

    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_user_isolation(client: AsyncClient, test_user: dict, mocker):
    """Test that users cannot access other users' tasks."""
    # Create task as user A
    mocker.patch("src.auth.get_current_user", return_value=test_user)
    response = await client.post("/api/tasks", json={"title": "User A task"})
    task_id = response.json()["id"]

    # Try to access as user B
    other_user = {"id": "other-user-456", "email": "other@example.com"}
    mocker.patch("src.auth.get_current_user", return_value=other_user)

    response = await client.get(f"/api/tasks/{task_id}")
    assert response.status_code == 404  # Should not find the task


@pytest.mark.asyncio
async def test_toggle_task(client: AsyncClient, test_user: dict, mocker):
    """Test toggling task completion."""
    mocker.patch("src.auth.get_current_user", return_value=test_user)

    # Create task
    response = await client.post("/api/tasks", json={"title": "Toggle test"})
    task_id = response.json()["id"]
    assert response.json()["completed"] is False

    # Toggle to completed
    response = await client.post(f"/api/tasks/{task_id}/toggle")
    assert response.status_code == 200
    assert response.json()["completed"] is True

    # Toggle back to incomplete
    response = await client.post(f"/api/tasks/{task_id}/toggle")
    assert response.json()["completed"] is False
```

## Dependencies

```toml
# pyproject.toml
[project]
dependencies = [
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.32.0",
    "sqlmodel>=0.0.22",
    "asyncpg>=0.30.0",           # PostgreSQL async driver
    "pydantic-settings>=2.0.0",
    "python-jose[cryptography]>=3.3.0",
    "passlib[bcrypt]>=1.7.4",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0.0",
    "pytest-asyncio>=0.24.0",
    "pytest-mock>=3.14.0",
    "aiosqlite>=0.20.0",         # SQLite async driver for tests
    "httpx>=0.27.0",             # Async HTTP client for tests
]
```

## Common Patterns

### Connection Health Check

```python
@app.get("/health/db")
async def health_db(session: AsyncSession = Depends(get_session)):
    """Check database connectivity."""
    try:
        await session.exec(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database unavailable: {str(e)}",
        )
```

### Transaction Management

```python
async def transfer_tasks(
    session: AsyncSession,
    from_user_id: str,
    to_user_id: str,
) -> None:
    """Transfer all tasks from one user to another atomically."""
    async with session.begin():
        statement = (
            update(Task)
            .where(Task.user_id == from_user_id)
            .values(user_id=to_user_id)
        )
        await session.exec(statement)
    # Commit happens automatically at end of context
```

### Bulk Operations

```python
async def bulk_complete_tasks(
    session: AsyncSession,
    user_id: str,
    task_ids: list[int],
) -> int:
    """Mark multiple tasks as completed."""
    statement = (
        update(Task)
        .where(
            Task.user_id == user_id,
            Task.id.in_(task_ids),
        )
        .values(completed=True, updated_at=datetime.utcnow())
    )
    result = await session.exec(statement)
    await session.commit()
    return result.rowcount
```

## References

- **[connection.md](references/connection.md)**: Deep dive into Neon connection patterns and pooling
- **[sqlmodel.md](references/sqlmodel.md)**: Advanced SQLModel patterns and relationships
- **[migrations.md](references/migrations.md)**: Database migration strategies and Alembic setup
- **[testing.md](references/testing.md)**: Comprehensive testing patterns and fixtures
