# Data Model: Todo In-Memory Console App

**Feature**: 001-todo-console-app
**Date**: 2025-12-29
**Status**: Complete

## Entity: Task

The core domain entity representing a single todo item.

### Definition

```python
from dataclasses import dataclass, field
from typing import Optional

@dataclass
class Task:
    """Represents a single todo item.

    Attributes:
        id: Unique identifier assigned by storage (None until persisted)
        description: Task text (1-500 characters)
        completed: Completion status (default: False)
    """
    description: str
    completed: bool = False
    id: Optional[int] = field(default=None)
```

### Fields

| Field | Type | Required | Default | Constraints |
|-------|------|----------|---------|-------------|
| id | int \| None | No (assigned by storage) | None | Positive integer, unique |
| description | str | Yes | - | Non-empty, max 500 chars |
| completed | bool | No | False | - |

### Validation Rules

| Field | Rule | Source |
|-------|------|--------|
| description | Must not be empty or whitespace-only | FR-007 |
| description | Must not exceed 500 characters | FR-012 |
| id | Must be positive integer when provided | FR-013 |

### State Transitions

```
┌─────────────┐       mark_complete()       ┌─────────────┐
│  INCOMPLETE │ ─────────────────────────▶  │  COMPLETED  │
│ (completed  │                              │ (completed  │
│   = False)  │                              │   = True)   │
└─────────────┘                              └─────────────┘
       │                                            │
       │              Already complete?             │
       │         ◀──────────────────────────────────┘
       │            (no-op, no error)
       ▼
   Created in INCOMPLETE state (spec US-1)
```

### Relationships

Phase I has a single entity with no relationships:

```
┌──────────────────────┐
│        Task          │
├──────────────────────┤
│ id: int?             │
│ description: str     │
│ completed: bool      │
└──────────────────────┘
```

Future phases (II+) will add:
- User → Task (one-to-many)
- Task → Tags (many-to-many)
- User → Conversation (one-to-many)

## Storage: TaskStorage

In-memory storage abstraction for Task entities.

### Definition

```python
class TaskStorage:
    """In-memory storage for Task entities.

    Provides CRUD operations with auto-incrementing IDs.
    Thread-safety is not required (single-user console app).
    """

    def __init__(self) -> None:
        self._tasks: dict[int, Task] = {}
        self._next_id: int = 1

    def add(self, task: Task) -> Task:
        """Add task and assign ID. Returns task with ID set."""
        ...

    def get(self, task_id: int) -> Task | None:
        """Get task by ID. Returns None if not found."""
        ...

    def get_all(self) -> list[Task]:
        """Get all tasks sorted by ID."""
        ...

    def update(self, task_id: int, task: Task) -> Task | None:
        """Update task. Returns updated task or None if not found."""
        ...

    def delete(self, task_id: int) -> bool:
        """Delete task. Returns True if deleted, False if not found."""
        ...
```

### Operations

| Operation | Input | Output | Errors |
|-----------|-------|--------|--------|
| add | Task (no ID) | Task (with ID) | ValidationError if description invalid |
| get | task_id: int | Task \| None | None |
| get_all | - | list[Task] | Never fails |
| update | task_id, Task | Task \| None | ValidationError if description invalid |
| delete | task_id: int | bool | Never fails |

### ID Assignment

- IDs are auto-incremented positive integers starting at 1
- IDs are never reused after deletion (spec US-5 scenario 3)
- ID sequence: 1, 2, 3, ... (monotonically increasing)

## Exceptions

```python
class TodoError(Exception):
    """Base exception for todo app errors."""
    pass

class TaskNotFoundError(TodoError):
    """Raised when requested task ID does not exist."""
    def __init__(self, task_id: int):
        self.task_id = task_id
        super().__init__(f"Task {task_id} not found")

class ValidationError(TodoError):
    """Raised when input validation fails."""
    def __init__(self, message: str):
        super().__init__(message)
```

## Display Format

When viewing tasks (spec US-2), display format:

```
ID  Status      Description
──  ──────      ───────────
1   [ ]         Buy groceries
2   [✓]         Call mom
3   [ ]         Finish report
```

- Status indicator: `[ ]` incomplete, `[✓]` complete
- Empty list message: "No tasks found. Add a task to get started!"
