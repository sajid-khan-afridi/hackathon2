# SQLModel Database Patterns

## Table of Contents

1. [Database Setup](#database-setup)
2. [Base Model](#base-model)
3. [User Model](#user-model)
4. [Todo Model](#todo-model)
5. [Relationships](#relationships)

## Database Setup

```python
# src/database.py
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession

from .config import settings

# Convert sync URL to async (postgresql:// -> postgresql+asyncpg://)
async_url = settings.database_url.replace(
    "postgresql://", "postgresql+asyncpg://"
)

engine = create_async_engine(async_url, echo=settings.debug)


async def create_db_and_tables():
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSession(engine) as session:
        yield session
```

## Base Model

```python
# src/models/base.py
from datetime import datetime
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


class BaseModel(SQLModel):
    """Base model with common fields for all entities."""

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    deleted_at: datetime | None = Field(default=None)  # Soft delete

    def soft_delete(self) -> None:
        """Mark record as deleted without removing from DB."""
        self.deleted_at = datetime.utcnow()

    @property
    def is_deleted(self) -> bool:
        return self.deleted_at is not None
```

## User Model

```python
# src/models/user.py
from sqlmodel import Field, Relationship

from .base import BaseModel


class User(BaseModel, table=True):
    __tablename__ = "users"

    email: str = Field(unique=True, index=True, max_length=255)
    hashed_password: str = Field(max_length=255)
    is_active: bool = Field(default=True)

    # Relationships
    todos: list["Todo"] = Relationship(back_populates="user")
```

## Todo Model

```python
# src/models/todo.py
from uuid import UUID

from sqlmodel import Field, Relationship

from .base import BaseModel


class Todo(BaseModel, table=True):
    __tablename__ = "todos"

    title: str = Field(max_length=255)
    description: str | None = Field(default=None, max_length=1000)
    is_completed: bool = Field(default=False)
    priority: int = Field(default=0, ge=0, le=3)  # 0=none, 1=low, 2=medium, 3=high

    # Foreign key
    user_id: UUID = Field(foreign_key="users.id", index=True)

    # Relationships
    user: "User" = Relationship(back_populates="todos")
```

## Relationships

### One-to-Many Pattern

```python
# Parent model
class User(BaseModel, table=True):
    todos: list["Todo"] = Relationship(back_populates="user")

# Child model
class Todo(BaseModel, table=True):
    user_id: UUID = Field(foreign_key="users.id", index=True)
    user: "User" = Relationship(back_populates="todos")
```

### Loading Related Data

```python
from sqlmodel import select
from sqlalchemy.orm import selectinload

# Eager load todos with user
statement = (
    select(Todo)
    .options(selectinload(Todo.user))
    .where(Todo.id == todo_id)
)
result = await session.exec(statement)
todo = result.first()
```

## Update Pattern

```python
async def update_todo(
    session: AsyncSession,
    todo: Todo,
    update_data: dict,
) -> Todo:
    for key, value in update_data.items():
        if hasattr(todo, key):
            setattr(todo, key, value)
    todo.updated_at = datetime.utcnow()
    session.add(todo)
    await session.commit()
    await session.refresh(todo)
    return todo
```
