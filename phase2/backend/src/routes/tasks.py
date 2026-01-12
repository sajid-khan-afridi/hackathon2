"""Task CRUD endpoints."""

from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from ..auth import AuthUser, get_current_user
from ..db import get_session
from ..models import Task
from ..schemas import (
    DeleteResponse,
    TaskCreate,
    TaskListResponse,
    TaskPublic,
    TaskResponse,
    TaskUpdate,
)

router = APIRouter()


def verify_user_access(user: AuthUser, user_id: str) -> None:
    """Verify that the authenticated user matches the path user_id."""
    if user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only access your own data",
        )


@router.get("/{user_id}/tasks", response_model=TaskListResponse)
async def list_tasks(
    user_id: str,
    user: Annotated[AuthUser, Depends(get_current_user)],
    session: Session = Depends(get_session),
) -> TaskListResponse:
    """List all tasks for the authenticated user."""
    verify_user_access(user, user_id)

    statement = select(Task).where(Task.user_id == user_id)
    tasks = session.exec(statement).all()

    return TaskListResponse(
        success=True,
        data=[TaskPublic.model_validate(task) for task in tasks],
    )


@router.post("/{user_id}/tasks", response_model=TaskResponse)
async def create_task(
    user_id: str,
    task_in: TaskCreate,
    user: Annotated[AuthUser, Depends(get_current_user)],
    session: Session = Depends(get_session),
) -> TaskResponse:
    """Create a new task for the authenticated user."""
    verify_user_access(user, user_id)

    task = Task(
        user_id=user_id,
        title=task_in.title,
        description=task_in.description,
    )
    session.add(task)
    session.commit()
    session.refresh(task)

    return TaskResponse(
        success=True,
        data=TaskPublic.model_validate(task),
    )


@router.get("/{user_id}/tasks/{task_id}", response_model=TaskResponse)
async def get_task(
    user_id: str,
    task_id: int,
    user: Annotated[AuthUser, Depends(get_current_user)],
    session: Session = Depends(get_session),
) -> TaskResponse:
    """Get a specific task by ID."""
    verify_user_access(user, user_id)

    statement = select(Task).where(
        Task.id == task_id,
        Task.user_id == user_id,
    )
    task = session.exec(statement).first()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    return TaskResponse(
        success=True,
        data=TaskPublic.model_validate(task),
    )


@router.put("/{user_id}/tasks/{task_id}", response_model=TaskResponse)
async def update_task(
    user_id: str,
    task_id: int,
    task_in: TaskUpdate,
    user: Annotated[AuthUser, Depends(get_current_user)],
    session: Session = Depends(get_session),
) -> TaskResponse:
    """Update an existing task."""
    verify_user_access(user, user_id)

    statement = select(Task).where(
        Task.id == task_id,
        Task.user_id == user_id,
    )
    task = session.exec(statement).first()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    # Update only provided fields
    update_data = task_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(task, field, value)

    task.updated_at = datetime.now(timezone.utc)
    session.add(task)
    session.commit()
    session.refresh(task)

    return TaskResponse(
        success=True,
        data=TaskPublic.model_validate(task),
    )


@router.delete("/{user_id}/tasks/{task_id}", response_model=DeleteResponse)
async def delete_task(
    user_id: str,
    task_id: int,
    user: Annotated[AuthUser, Depends(get_current_user)],
    session: Session = Depends(get_session),
) -> DeleteResponse:
    """Delete a task."""
    verify_user_access(user, user_id)

    statement = select(Task).where(
        Task.id == task_id,
        Task.user_id == user_id,
    )
    task = session.exec(statement).first()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    session.delete(task)
    session.commit()

    return DeleteResponse(success=True, message="Task deleted successfully")


@router.patch("/{user_id}/tasks/{task_id}/complete", response_model=TaskResponse)
async def toggle_task_complete(
    user_id: str,
    task_id: int,
    user: Annotated[AuthUser, Depends(get_current_user)],
    session: Session = Depends(get_session),
) -> TaskResponse:
    """Toggle task completion status."""
    verify_user_access(user, user_id)

    statement = select(Task).where(
        Task.id == task_id,
        Task.user_id == user_id,
    )
    task = session.exec(statement).first()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    task.completed = not task.completed
    task.updated_at = datetime.now(timezone.utc)
    session.add(task)
    session.commit()
    session.refresh(task)

    return TaskResponse(
        success=True,
        data=TaskPublic.model_validate(task),
    )
