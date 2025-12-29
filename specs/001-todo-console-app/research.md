# Research: Todo In-Memory Console App

**Feature**: 001-todo-console-app
**Date**: 2025-12-29
**Status**: Complete

## Research Tasks

### 1. Python 3.13+ Features for Console Apps

**Decision**: Use Python 3.13+ with dataclasses for Task model

**Rationale**:
- Python 3.13 provides improved error messages for debugging
- `dataclasses` module (stdlib) provides clean model definition without external dependencies
- Type hints are well-supported for mypy static analysis
- No need for Pydantic in Phase I (no serialization requirements)

**Alternatives Considered**:
- Plain classes: More boilerplate, less readable
- NamedTuple: Immutable, harder to update task status
- Pydantic: Overkill for in-memory console app, adds unnecessary dependency

### 2. In-Memory Storage Strategy

**Decision**: Use Python dict with integer keys for O(1) lookup

**Rationale**:
- Dict provides O(1) access by task ID (spec requires lookup by ID)
- Simple to implement add/delete/update operations
- Naturally supports unique ID constraint
- Memory-efficient for expected scale (10,000+ tasks)

**Alternatives Considered**:
- List: O(n) lookup by ID, requires iteration
- SQLite in-memory: Overkill, adds complexity
- OrderedDict: Insertion order not required by spec

**Implementation Pattern**:
```python
class TaskStorage:
    def __init__(self):
        self._tasks: dict[int, Task] = {}
        self._next_id: int = 1

    def add(self, task: Task) -> int:
        task_id = self._next_id
        self._tasks[task_id] = task
        self._next_id += 1
        return task_id
```

### 3. CLI Menu Design Pattern

**Decision**: Simple numbered menu with input loop

**Rationale**:
- Spec requires "numbered menu options for operation selection" (Assumptions)
- Standard input/print is sufficient for Phase I
- No external CLI library needed (click, argparse not required)
- Clear user feedback with error messages

**Menu Structure**:
```
=== Todo App ===
1. Add Task
2. View Tasks
3. Mark Complete
4. Update Task
5. Delete Task
6. Exit

Enter choice (1-6):
```

**Alternatives Considered**:
- Click library: Overkill for simple menu, adds dependency
- Argparse: Better for command-line args, not interactive menus
- Rich library: Nice formatting but unnecessary dependency

### 4. Input Validation Strategy

**Decision**: Validate at operation boundaries (operations.py)

**Rationale**:
- Spec defines specific validation rules (FR-007, FR-012, FR-013)
- Centralized validation in operations module
- Clear error messages returned to CLI layer
- Separation of concerns: CLI handles I/O, operations handle logic

**Validation Rules**:
| Input | Validation | Error Message |
|-------|------------|---------------|
| Task description | Non-empty, ≤500 chars | "Description cannot be empty" / "Description exceeds 500 characters" |
| Task ID | Positive integer | "Invalid task ID" |
| Task existence | ID exists in storage | "Task not found" |

### 5. Testing Strategy

**Decision**: pytest with fixtures for storage isolation

**Rationale**:
- Constitution requires pytest and 80% coverage
- Fixtures provide clean test isolation
- No mocking needed for pure in-memory operations
- Test organization: unit (models, storage), integration (operations)

**Test Fixtures**:
```python
@pytest.fixture
def storage():
    """Fresh storage instance for each test."""
    return TaskStorage()

@pytest.fixture
def sample_task():
    """Task with known values for testing."""
    return Task(description="Test task", completed=False)
```

### 6. Error Handling Approach

**Decision**: Use custom exceptions for domain errors

**Rationale**:
- Clear separation between expected errors (TaskNotFound) and bugs
- CLI layer catches exceptions and displays user-friendly messages
- Supports testing error conditions explicitly

**Exception Hierarchy**:
```python
class TodoError(Exception):
    """Base exception for todo app."""
    pass

class TaskNotFoundError(TodoError):
    """Raised when task ID doesn't exist."""
    pass

class ValidationError(TodoError):
    """Raised when input validation fails."""
    pass
```

## Resolved Clarifications

All technical unknowns from the Technical Context have been resolved:

| Unknown | Resolution |
|---------|------------|
| External dependencies | None - stdlib only (dataclasses, typing) |
| ID generation | Auto-increment integer starting at 1 |
| Storage structure | Dict with int keys |
| CLI framework | Plain input()/print() |
| Validation layer | Operations module |

## Next Steps

Proceed to Phase 1: Design & Contracts
- Generate data-model.md with Task entity definition
- Generate quickstart.md for development setup
- No API contracts needed (console app, not web service)
