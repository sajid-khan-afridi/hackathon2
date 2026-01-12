"""Pydantic request/response schemas."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class ErrorResponse(BaseModel):
    """Standardized error response format."""

    detail: str
    status_code: int
    request_id: str
    code: str | None = None


class HealthResponse(BaseModel):
    """Health check response."""

    status: str
    timestamp: datetime


class TaskCreate(BaseModel):
    """Schema for creating a new task."""

    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=2000)


class TaskUpdate(BaseModel):
    """Schema for updating a task (partial update)."""

    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=2000)


class TaskPublic(BaseModel):
    """Schema for task API responses."""

    model_config = {"from_attributes": True}

    id: int
    title: str
    description: str | None
    completed: bool
    created_at: datetime
    updated_at: datetime


class TaskResponse(BaseModel):
    """Wrapper for single task response."""

    success: bool = True
    data: TaskPublic


class TaskListResponse(BaseModel):
    """Wrapper for task list response."""

    success: bool = True
    data: list[TaskPublic]


class DeleteResponse(BaseModel):
    """Response for delete operations."""

    success: bool = True
    message: str = "Task deleted successfully"


class SuccessResponse(BaseModel):
    """Generic success response."""

    success: bool = True
    data: Any = None
