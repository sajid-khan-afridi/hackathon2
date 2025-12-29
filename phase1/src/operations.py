"""Business logic operations for Todo Console App"""

from src.models import Task, TaskNotFoundError, ValidationError
from src.storage import TaskStorage


def add_task(storage: TaskStorage, description: str) -> Task:
    """Add a new task with description.

    Args:
        storage: TaskStorage instance
        description: Task description (1-500 characters)

    Returns:
        Created task with assigned ID

    Raises:
        ValidationError: If description is empty or exceeds 500 characters
    """
    # Strip whitespace
    description = description.strip()

    # Validate non-empty
    if not description:
        raise ValidationError("Description cannot be empty")

    # Validate max length
    if len(description) > 500:
        raise ValidationError("Description exceeds 500 characters")

    # Create and add task
    task = Task(description=description, completed=False)
    return storage.add(task)


def view_tasks(storage: TaskStorage) -> str:
    """View all tasks with formatted display.

    Args:
        storage: TaskStorage instance

    Returns:
        Formatted string with task list or empty message
    """
    tasks = storage.get_all()

    if not tasks:
        return "No tasks found. Add a task to get started!"

    # Build formatted output
    lines = []
    lines.append("\nID  Status      Description")
    lines.append("──  ──────      ───────────")

    for task in tasks:
        status = "[✓]" if task.completed else "[ ]"
        lines.append(f"{task.id:<3} {status:<11} {task.description}")

    return "\n".join(lines)


def mark_complete(storage: TaskStorage, task_id: int) -> None:
    """Mark a task as complete.

    Args:
        storage: TaskStorage instance
        task_id: ID of task to mark complete

    Raises:
        TaskNotFoundError: If task ID does not exist
    """
    task = storage.get(task_id)
    if task is None:
        raise TaskNotFoundError(task_id)

    task.completed = True
    storage.update(task_id, task)


def update_task(storage: TaskStorage, task_id: int, description: str) -> None:
    """Update a task's description.

    Args:
        storage: TaskStorage instance
        task_id: ID of task to update
        description: New description (1-500 characters)

    Raises:
        TaskNotFoundError: If task ID does not exist
        ValidationError: If description is empty or exceeds 500 characters
    """
    task = storage.get(task_id)
    if task is None:
        raise TaskNotFoundError(task_id)

    # Strip whitespace
    description = description.strip()

    # Validate non-empty
    if not description:
        raise ValidationError("Description cannot be empty")

    # Validate max length
    if len(description) > 500:
        raise ValidationError("Description exceeds 500 characters")

    task.description = description
    storage.update(task_id, task)


def delete_task(storage: TaskStorage, task_id: int) -> None:
    """Delete a task.

    Args:
        storage: TaskStorage instance
        task_id: ID of task to delete

    Raises:
        TaskNotFoundError: If task ID does not exist
    """
    success = storage.delete(task_id)
    if not success:
        raise TaskNotFoundError(task_id)
