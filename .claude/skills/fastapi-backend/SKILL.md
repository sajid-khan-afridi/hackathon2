---
name: fastapi-backend
description: "FastAPI backend development skill for Todo Full-Stack application. Use when: (1) Creating FastAPI entry points and configuration, (2) Defining SQLModel database models, (3) Implementing RESTful API endpoints with proper validation, (4) Setting up JWT authentication middleware, (5) Creating Pydantic request/response schemas, (6) Implementing user data isolation patterns, (7) Writing pytest tests for API endpoints. Covers Python 3.13+, FastAPI, SQLModel, Pydantic, and async patterns."
---

# FastAPI Backend

Build production-ready FastAPI backends with SQLModel, JWT auth, and comprehensive testing.

## Quick Start

### Project Structure

```
backend/
├── src/
│   ├── __init__.py
│   ├── main.py           # FastAPI app entry point
│   ├── config.py         # Settings and configuration
│   ├── database.py       # Database connection and session
│   ├── models/           # SQLModel database models
│   │   ├── __init__.py
│   │   ├── base.py       # Base model with common fields
│   │   ├── user.py
│   │   └── todo.py
│   ├── schemas/          # Pydantic request/response schemas
│   │   ├── __init__.py
│   │   ├── user.py
│   │   └── todo.py
│   ├── routers/          # API route handlers
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── users.py
│   │   └── todos.py
│   ├── services/         # Business logic layer
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   └── todo.py
│   └── middleware/       # Custom middleware
│       ├── __init__.py
│       └── auth.py
├── tests/
│   ├── __init__.py
│   ├── conftest.py       # Pytest fixtures
│   ├── test_auth.py
│   └── test_todos.py
├── pyproject.toml
└── .env.example
```

### Entry Point Pattern

```python
# src/main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import create_db_and_tables
from .routers import auth, todos, users


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await create_db_and_tables()
    yield
    # Shutdown (cleanup if needed)


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(todos.router, prefix="/api/v1/todos", tags=["todos"])


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
```

### Configuration Pattern

```python
# src/config.py
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Todo API"
    debug: bool = False

    # Database
    database_url: str

    # JWT
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 30

    # CORS
    cors_origins: list[str] = ["http://localhost:3000"]

    class Config:
        env_file = ".env"


settings = Settings()
```

## Core Patterns

### Database Models

See [references/models.md](references/models.md) for SQLModel patterns including:
- Base model with timestamps and soft delete
- User model with password hashing
- Todo model with user relationship
- Async database session management

### API Endpoints

See [references/endpoints.md](references/endpoints.md) for:
- CRUD endpoint patterns
- Dependency injection for auth
- User data isolation (filter by user_id)
- Pagination and filtering
- Error handling

### Authentication

See [references/auth.md](references/auth.md) for:
- JWT token generation and validation
- Password hashing with bcrypt
- Auth middleware and dependencies
- Protected route patterns

### Request/Response Schemas

See [references/schemas.md](references/schemas.md) for:
- Pydantic model patterns
- Input validation
- Response serialization
- Partial update schemas

### Testing

See [references/testing.md](references/testing.md) for:
- Pytest fixtures for FastAPI
- Test database setup
- Auth token fixtures
- CRUD test patterns

## Key Dependencies

```toml
# pyproject.toml
[project]
dependencies = [
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.32.0",
    "sqlmodel>=0.0.22",
    "asyncpg>=0.30.0",           # PostgreSQL async driver
    "pydantic-settings>=2.0.0",
    "python-jose[cryptography]>=3.3.0",  # JWT
    "passlib[bcrypt]>=1.7.4",    # Password hashing
    "httpx>=0.27.0",             # Async HTTP client (testing)
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0.0",
    "pytest-asyncio>=0.24.0",
    "pytest-cov>=5.0.0",
]
```

## Common Patterns

### User Data Isolation

Always filter queries by current user:

```python
async def get_user_todos(
    session: AsyncSession,
    user_id: UUID,
    skip: int = 0,
    limit: int = 100,
) -> list[Todo]:
    statement = (
        select(Todo)
        .where(Todo.user_id == user_id)
        .where(Todo.deleted_at.is_(None))
        .offset(skip)
        .limit(limit)
    )
    result = await session.exec(statement)
    return result.all()
```

### Error Responses

Use consistent error format:

```python
from fastapi import HTTPException, status

# Not found
raise HTTPException(
    status_code=status.HTTP_404_NOT_FOUND,
    detail="Todo not found",
)

# Validation error
raise HTTPException(
    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
    detail="Invalid input",
)

# Auth error
raise HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Invalid credentials",
    headers={"WWW-Authenticate": "Bearer"},
)
```

### Async Best Practices

- Use `async def` for all route handlers
- Use `AsyncSession` for database operations
- Use `httpx.AsyncClient` for external API calls
- Avoid blocking operations in async context
