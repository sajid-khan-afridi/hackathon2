# Pydantic Request/Response Schemas

## Table of Contents

1. [Base Schema Patterns](#base-schema-patterns)
2. [Auth Schemas](#auth-schemas)
3. [Todo Schemas](#todo-schemas)
4. [User Schemas](#user-schemas)
5. [Validation Patterns](#validation-patterns)

## Base Schema Patterns

```python
# src/schemas/base.py
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class BaseSchema(BaseModel):
    """Base schema with common config."""

    model_config = ConfigDict(
        from_attributes=True,  # Allow ORM model conversion
        str_strip_whitespace=True,  # Strip whitespace from strings
    )


class TimestampMixin(BaseModel):
    """Mixin for timestamp fields in responses."""

    created_at: datetime
    updated_at: datetime


class IDMixin(BaseModel):
    """Mixin for ID field in responses."""

    id: UUID
```

## Auth Schemas

```python
# src/schemas/auth.py
from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: str  # User ID
    exp: int  # Expiration timestamp
```

## Todo Schemas

```python
# src/schemas/todo.py
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


# Create schema - what client sends to create
class TodoCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=1000)
    priority: int = Field(default=0, ge=0, le=3)


# Update schema - partial updates (all fields optional)
class TodoUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=1000)
    is_completed: bool | None = None
    priority: int | None = Field(default=None, ge=0, le=3)


# Response schema - what server returns
class TodoResponse(BaseModel):
    id: UUID
    title: str
    description: str | None
    is_completed: bool
    priority: int
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# List response with metadata
class TodoListResponse(BaseModel):
    items: list[TodoResponse]
    total: int
```

## User Schemas

```python
# src/schemas/user.py
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserUpdate(BaseModel):
    email: EmailStr | None = None
    password: str | None = Field(default=None, min_length=8, max_length=128)


class UserResponse(BaseModel):
    id: UUID
    email: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# For internal use - includes sensitive fields
class UserInternal(UserResponse):
    hashed_password: str
    updated_at: datetime
```

## Validation Patterns

### Custom Validators

```python
from pydantic import BaseModel, field_validator


class TodoCreate(BaseModel):
    title: str
    priority: int = 0

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Title cannot be empty or whitespace")
        return v.strip()

    @field_validator("priority")
    @classmethod
    def priority_range(cls, v: int) -> int:
        if v < 0 or v > 3:
            raise ValueError("Priority must be between 0 and 3")
        return v
```

### Computed Fields

```python
from pydantic import BaseModel, computed_field


class TodoResponse(BaseModel):
    title: str
    is_completed: bool
    priority: int

    @computed_field
    @property
    def priority_label(self) -> str:
        labels = {0: "none", 1: "low", 2: "medium", 3: "high"}
        return labels.get(self.priority, "unknown")

    model_config = {"from_attributes": True}
```

### Nested Schemas

```python
class TodoWithUser(BaseModel):
    id: UUID
    title: str
    user: UserResponse  # Nested user schema

    model_config = {"from_attributes": True}
```

### Exclude Fields from Response

```python
class UserResponse(BaseModel):
    id: UUID
    email: str
    is_active: bool

    model_config = {
        "from_attributes": True,
        # Exclude sensitive fields
        "json_schema_extra": {
            "examples": [
                {
                    "id": "123e4567-e89b-12d3-a456-426614174000",
                    "email": "user@example.com",
                    "is_active": True,
                }
            ]
        },
    }
```

### Model to Schema Conversion

```python
# In service layer
from ..models.todo import Todo
from ..schemas.todo import TodoResponse


def model_to_response(todo: Todo) -> TodoResponse:
    return TodoResponse.model_validate(todo)


def models_to_responses(todos: list[Todo]) -> list[TodoResponse]:
    return [TodoResponse.model_validate(t) for t in todos]
```
