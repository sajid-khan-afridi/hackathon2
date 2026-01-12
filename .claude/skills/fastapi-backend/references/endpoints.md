# API Endpoint Patterns

## Table of Contents

1. [Router Setup](#router-setup)
2. [CRUD Endpoints](#crud-endpoints)
3. [Dependency Injection](#dependency-injection)
4. [Pagination](#pagination)
5. [Filtering](#filtering)
6. [Error Handling](#error-handling)

## Router Setup

```python
# src/routers/todos.py
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel.ext.asyncio.session import AsyncSession

from ..database import get_session
from ..middleware.auth import get_current_user
from ..models.todo import Todo
from ..models.user import User
from ..schemas.todo import TodoCreate, TodoResponse, TodoUpdate
from ..services.todo import TodoService

router = APIRouter()
```

## CRUD Endpoints

### Create

```python
@router.post("/", response_model=TodoResponse, status_code=status.HTTP_201_CREATED)
async def create_todo(
    todo_in: TodoCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Todo:
    service = TodoService(session)
    return await service.create(todo_in, current_user.id)
```

### Read (List with Pagination)

```python
@router.get("/", response_model=list[TodoResponse])
async def list_todos(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> list[Todo]:
    service = TodoService(session)
    return await service.get_all(current_user.id, skip=skip, limit=limit)
```

### Read (Single)

```python
@router.get("/{todo_id}", response_model=TodoResponse)
async def get_todo(
    todo_id: UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Todo:
    service = TodoService(session)
    todo = await service.get_by_id(todo_id, current_user.id)
    if not todo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo not found",
        )
    return todo
```

### Update (Partial)

```python
@router.patch("/{todo_id}", response_model=TodoResponse)
async def update_todo(
    todo_id: UUID,
    todo_in: TodoUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Todo:
    service = TodoService(session)
    todo = await service.get_by_id(todo_id, current_user.id)
    if not todo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo not found",
        )
    return await service.update(todo, todo_in)
```

### Delete (Soft)

```python
@router.delete("/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_todo(
    todo_id: UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> None:
    service = TodoService(session)
    todo = await service.get_by_id(todo_id, current_user.id)
    if not todo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo not found",
        )
    await service.soft_delete(todo)
```

## Dependency Injection

### Common Dependencies

```python
# Reusable dependency for todo ownership check
async def get_todo_or_404(
    todo_id: UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Todo:
    service = TodoService(session)
    todo = await service.get_by_id(todo_id, current_user.id)
    if not todo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo not found",
        )
    return todo


# Use in endpoints
@router.patch("/{todo_id}", response_model=TodoResponse)
async def update_todo(
    todo_in: TodoUpdate,
    todo: Todo = Depends(get_todo_or_404),
    session: AsyncSession = Depends(get_session),
) -> Todo:
    service = TodoService(session)
    return await service.update(todo, todo_in)
```

## Pagination

### Pagination Schema

```python
from pydantic import BaseModel


class PaginatedResponse[T](BaseModel):
    items: list[T]
    total: int
    skip: int
    limit: int
    has_more: bool
```

### Paginated Endpoint

```python
@router.get("/", response_model=PaginatedResponse[TodoResponse])
async def list_todos(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    service = TodoService(session)
    items, total = await service.get_paginated(
        current_user.id, skip=skip, limit=limit
    )
    return PaginatedResponse(
        items=items,
        total=total,
        skip=skip,
        limit=limit,
        has_more=skip + limit < total,
    )
```

## Filtering

```python
@router.get("/", response_model=list[TodoResponse])
async def list_todos(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    is_completed: bool | None = Query(None),
    priority: int | None = Query(None, ge=0, le=3),
    search: str | None = Query(None, max_length=100),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> list[Todo]:
    service = TodoService(session)
    return await service.get_filtered(
        user_id=current_user.id,
        skip=skip,
        limit=limit,
        is_completed=is_completed,
        priority=priority,
        search=search,
    )
```

### Service Layer Filtering

```python
# src/services/todo.py
async def get_filtered(
    self,
    user_id: UUID,
    skip: int = 0,
    limit: int = 100,
    is_completed: bool | None = None,
    priority: int | None = None,
    search: str | None = None,
) -> list[Todo]:
    statement = (
        select(Todo)
        .where(Todo.user_id == user_id)
        .where(Todo.deleted_at.is_(None))
    )

    if is_completed is not None:
        statement = statement.where(Todo.is_completed == is_completed)

    if priority is not None:
        statement = statement.where(Todo.priority == priority)

    if search:
        statement = statement.where(
            Todo.title.ilike(f"%{search}%")
        )

    statement = statement.offset(skip).limit(limit)
    result = await self.session.exec(statement)
    return result.all()
```

## Error Handling

### Custom Exception Handler

```python
# src/main.py
from fastapi import Request
from fastapi.responses import JSONResponse


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )
```

### Validation Error Format

```python
from fastapi.exceptions import RequestValidationError


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request, exc: RequestValidationError
):
    return JSONResponse(
        status_code=422,
        content={
            "detail": "Validation error",
            "errors": exc.errors(),
        },
    )
```
