"""In-memory storage for Task entities"""

from src.models import Task


class TaskStorage:
    """In-memory storage for Task entities.

    Provides CRUD operations with auto-incrementing IDs.
    Thread-safety is not required (single-user console app).
    """

    def __init__(self) -> None:
        """Initialize storage with empty task dict and ID counter."""
        self._tasks: dict[int, Task] = {}
        self._next_id: int = 1

    def add(self, task: Task) -> Task:
        """Add task and assign ID.

        Args:
            task: Task instance without ID

        Returns:
            Task instance with ID assigned
        """
        task.id = self._next_id
        self._tasks[self._next_id] = task
        self._next_id += 1
        return task

    def get(self, task_id: int) -> Task | None:
        """Get task by ID.

        Args:
            task_id: Unique task identifier

        Returns:
            Task if found, None otherwise
        """
        return self._tasks.get(task_id)

    def get_all(self) -> list[Task]:
        """Get all tasks sorted by ID.

        Returns:
            List of all tasks ordered by ID (ascending)
        """
        return [self._tasks[task_id] for task_id in sorted(self._tasks.keys())]

    def update(self, task_id: int, task: Task) -> Task | None:
        """Update task.

        Args:
            task_id: ID of task to update
            task: Updated task instance

        Returns:
            Updated task if found, None otherwise
        """
        if task_id not in self._tasks:
            return None
        task.id = task_id
        self._tasks[task_id] = task
        return task

    def delete(self, task_id: int) -> bool:
        """Delete task.

        Args:
            task_id: ID of task to delete

        Returns:
            True if deleted, False if not found
        """
        if task_id in self._tasks:
            del self._tasks[task_id]
            return True
        return False
