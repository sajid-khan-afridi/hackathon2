"""Data models and exceptions for Todo Console App"""

from dataclasses import dataclass, field


class TodoError(Exception):
    """Base exception for todo app errors."""

    pass


class TaskNotFoundError(TodoError):
    """Raised when requested task ID does not exist."""

    def __init__(self, task_id: int) -> None:
        self.task_id = task_id
        super().__init__(f"Task {task_id} not found")


class ValidationError(TodoError):
    """Raised when input validation fails."""

    def __init__(self, message: str) -> None:
        super().__init__(message)


@dataclass
class Task:
    """Represents a single todo item.

    Attributes:
        description: Task text (1-500 characters)
        completed: Completion status (default: False)
        id: Unique identifier assigned by storage (None until persisted)
    """

    description: str
    completed: bool = False
    id: int | None = field(default=None)
