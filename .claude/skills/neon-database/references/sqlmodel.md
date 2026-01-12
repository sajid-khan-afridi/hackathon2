# SQLModel Patterns

Advanced SQLModel patterns for the Todo application.

## Model Inheritance

### Base Models with Shared Fields

```python
from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class TimestampMixin(SQLModel):
    """Mixin that adds created_at and updated_at timestamps."""

    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        nullable=False,
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        nullable=False,
        sa_column_kwargs={"onupdate": datetime.utcnow},
    )


class SoftDeleteMixin(SQLModel):
    """Mixin for soft delete functionality."""

    deleted_at: Optional[datetime] = Field(default=None, nullable=True)

    @property
    def is_deleted(self) -> bool:
        return self.deleted_at is not None


class UserOwnedMixin(SQLModel):
    """Mixin for models that belong to a user."""

    user_id: str = Field(index=True, nullable=False)
```

### Complete Task Model

```python
class TaskBase(SQLModel):
    """Base fields for task - shared between schemas."""

    title: str = Field(
        min_length=1,
        max_length=200,
        description="Task title",
    )
    description: Optional[str] = Field(
        default=None,
        max_length=2000,
        description="Optional task description",
    )


class Task(TaskBase, TimestampMixin, UserOwnedMixin, table=True):
    """Database model for tasks."""

    __tablename__ = "tasks"
    __table_args__ = (
        Index("idx_tasks_user_completed", "user_id", "completed"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    completed: bool = Field(default=False, index=True)
```

## Schema Patterns

### Create Schema (Input)

```python
class TaskCreate(TaskBase):
    """Schema for creating a new task."""

    # Inherits title and description from TaskBase
    # No additional fields needed
    pass
```

### Update Schema (Partial)

```python
class TaskUpdate(SQLModel):
    """Schema for partial task updates."""

    title: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=200,
    )
    description: Optional[str] = Field(default=None, max_length=2000)

    # Note: completed is handled via toggle endpoint
```

### Response Schema (Output)

```python
class TaskResponse(TaskBase):
    """Schema for task API responses."""

    id: int
    completed: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True  # Enable ORM mode
```

### List Response with Metadata

```python
class TaskListResponse(SQLModel):
    """Paginated list response."""

    items: list[TaskResponse]
    total: int
    skip: int
    limit: int

    @property
    def has_more(self) -> bool:
        return self.skip + len(self.items) < self.total
```

## Query Patterns

### Basic CRUD Operations

```python
from sqlmodel import select, func
from sqlalchemy.ext.asyncio import AsyncSession


async def get_by_id(
    session: AsyncSession,
    task_id: int,
    user_id: str,
) -> Task | None:
    """Get task by ID with user ownership check."""
    statement = select(Task).where(
        Task.id == task_id,
        Task.user_id == user_id,
    )
    result = await session.exec(statement)
    return result.first()


async def get_all(
    session: AsyncSession,
    user_id: str,
    skip: int = 0,
    limit: int = 100,
) -> list[Task]:
    """Get all tasks for a user with pagination."""
    statement = (
        select(Task)
        .where(Task.user_id == user_id)
        .order_by(Task.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    result = await session.exec(statement)
    return list(result.all())


async def count(
    session: AsyncSession,
    user_id: str,
) -> int:
    """Count tasks for a user."""
    statement = (
        select(func.count())
        .select_from(Task)
        .where(Task.user_id == user_id)
    )
    result = await session.exec(statement)
    return result.one()
```

### Filtered Queries

```python
from enum import Enum


class TaskFilter(str, Enum):
    ALL = "all"
    PENDING = "pending"
    COMPLETED = "completed"


async def get_filtered(
    session: AsyncSession,
    user_id: str,
    filter_by: TaskFilter = TaskFilter.ALL,
    skip: int = 0,
    limit: int = 100,
) -> list[Task]:
    """Get tasks with optional completion filter."""
    statement = select(Task).where(Task.user_id == user_id)

    if filter_by == TaskFilter.PENDING:
        statement = statement.where(Task.completed == False)
    elif filter_by == TaskFilter.COMPLETED:
        statement = statement.where(Task.completed == True)

    statement = (
        statement
        .order_by(Task.completed, Task.created_at.desc())
        .offset(skip)
        .limit(limit)
    )

    result = await session.exec(statement)
    return list(result.all())
```

### Search Queries

```python
async def search(
    session: AsyncSession,
    user_id: str,
    query: str,
    skip: int = 0,
    limit: int = 100,
) -> list[Task]:
    """Search tasks by title or description."""
    search_term = f"%{query}%"
    statement = (
        select(Task)
        .where(
            Task.user_id == user_id,
            (Task.title.ilike(search_term)) | (Task.description.ilike(search_term)),
        )
        .order_by(Task.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    result = await session.exec(statement)
    return list(result.all())
```

## Update Patterns

### Partial Update

```python
from datetime import datetime


async def update(
    session: AsyncSession,
    task: Task,
    update_data: TaskUpdate,
) -> Task:
    """Apply partial update to task."""
    # Only update provided fields
    update_dict = update_data.model_dump(exclude_unset=True)

    for field, value in update_dict.items():
        setattr(task, field, value)

    task.updated_at = datetime.utcnow()
    session.add(task)
    await session.commit()
    await session.refresh(task)
    return task
```

### Bulk Update

```python
from sqlmodel import update


async def bulk_complete(
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
        .values(
            completed=True,
            updated_at=datetime.utcnow(),
        )
    )
    result = await session.exec(statement)
    await session.commit()
    return result.rowcount


async def bulk_delete(
    session: AsyncSession,
    user_id: str,
    task_ids: list[int],
) -> int:
    """Delete multiple tasks."""
    statement = (
        delete(Task)
        .where(
            Task.user_id == user_id,
            Task.id.in_(task_ids),
        )
    )
    result = await session.exec(statement)
    await session.commit()
    return result.rowcount
```

## Validation Patterns

### Custom Validators

```python
from pydantic import field_validator


class TaskCreate(TaskBase):
    """Schema with custom validation."""

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        """Ensure title is not just whitespace."""
        if not v.strip():
            raise ValueError("Title cannot be empty or whitespace only")
        return v.strip()

    @field_validator("description")
    @classmethod
    def description_cleanup(cls, v: str | None) -> str | None:
        """Clean up description whitespace."""
        if v is not None:
            v = v.strip()
            return v if v else None
        return None
```

### Model Validators

```python
from pydantic import model_validator


class TaskUpdate(SQLModel):
    """Update schema with cross-field validation."""

    title: Optional[str] = None
    description: Optional[str] = None

    @model_validator(mode="after")
    def check_at_least_one_field(self) -> "TaskUpdate":
        """Ensure at least one field is provided for update."""
        if self.title is None and self.description is None:
            raise ValueError("At least one field must be provided for update")
        return self
```

## Serialization Patterns

### Custom JSON Encoders

```python
from datetime import datetime
from pydantic import ConfigDict


class TaskResponse(TaskBase):
    """Response with custom serialization."""

    id: int
    completed: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
        json_encoders={
            datetime: lambda v: v.isoformat(),
        },
    )
```

### Computed Fields

```python
from pydantic import computed_field


class TaskResponse(TaskBase):
    """Response with computed fields."""

    id: int
    completed: bool
    created_at: datetime
    updated_at: datetime

    @computed_field
    @property
    def age_days(self) -> int:
        """Days since task was created."""
        delta = datetime.utcnow() - self.created_at
        return delta.days

    @computed_field
    @property
    def status(self) -> str:
        """Human-readable status."""
        return "completed" if self.completed else "pending"
```

## Type Safety

### Strict Mode

```python
from pydantic import ConfigDict


class TaskCreate(TaskBase):
    """Strict input validation."""

    model_config = ConfigDict(
        strict=True,  # No type coercion
        extra="forbid",  # No extra fields allowed
    )
```

### Optional vs Required

```python
# Required field (no default)
title: str = Field(min_length=1, max_length=200)

# Optional field (with None default)
description: Optional[str] = Field(default=None)

# Optional field for updates (exclude if not provided)
title: Optional[str] = Field(default=None)  # Use exclude_unset=True when dumping
```
