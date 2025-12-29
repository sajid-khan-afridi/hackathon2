# Claude Code Instructions - Phase I: Todo Console App

## Project Context

**Phase**: I - In-Memory Python Console App
**Feature**: 001-todo-console-app
**Status**: Implementation in progress

## Technical Stack

- **Language**: Python 3.13+
- **Package Manager**: UV (latest)
- **Storage**: In-memory (dict-based, no persistence)
- **Testing**: pytest with pytest-cov (80% coverage target)
- **Linting**: black, ruff, mypy

## Architecture

### Module Structure

```
src/
├── models.py      - Task dataclass and custom exceptions
├── storage.py     - TaskStorage class (in-memory CRUD)
├── operations.py  - Business logic (add, view, update, delete, complete)
└── main.py        - CLI entry point with menu loop
```

### Design Principles

1. **Test-Driven Development**: Write tests before implementation
2. **Library-First**: Modular design with clear separation of concerns
3. **YAGNI**: No persistence, no external dependencies beyond dev tools
4. **Validation**: Non-empty descriptions, max 500 chars, positive integer IDs

## Key Files

- **Spec**: `/mnt/d/GitHub Connected/hackathon2/specs/001-todo-console-app/spec.md`
- **Plan**: `/mnt/d/GitHub Connected/hackathon2/specs/001-todo-console-app/plan.md`
- **Tasks**: `/mnt/d/GitHub Connected/hackathon2/specs/001-todo-console-app/tasks.md`
- **Data Model**: `/mnt/d/GitHub Connected/hackathon2/specs/001-todo-console-app/data-model.md`

## Implementation Rules

### Task Model (models.py)

```python
@dataclass
class Task:
    description: str
    completed: bool = False
    id: Optional[int] = field(default=None)
```

### Storage Layer (storage.py)

- Dict-based storage with auto-incrementing IDs
- IDs never reused after deletion
- O(1) lookup by task ID

### Validation Rules

| Input | Rule | Error Message |
|-------|------|---------------|
| Description | Non-empty, ≤500 chars | "Description cannot be empty" / "Description exceeds 500 characters" |
| Task ID | Positive integer | "Invalid task ID" |
| Task existence | Must exist in storage | "Task not found" |

### Display Format

```
ID  Status      Description
──  ──────      ───────────
1   [ ]         Buy groceries
2   [✓]         Call mom
```

- Incomplete: `[ ]`
- Complete: `[✓]`
- Empty list: "No tasks found. Add a task to get started!"

## Testing Requirements

- **Coverage**: Minimum 80%
- **Strategy**: Unit tests for models/storage, integration tests for operations
- **Fixtures**: Fresh storage instance per test
- **Pattern**: Arrange-Act-Assert

### Test Organization

```
tests/
├── test_models.py      - Task dataclass, exception tests
├── test_storage.py     - TaskStorage CRUD operations
└── test_operations.py  - Business logic integration tests
```

## Code Quality Standards

```bash
# Before committing:
black src tests
ruff check src tests
mypy src
pytest --cov=src --cov-fail-under=80
```

## Common Commands

```bash
# Run app
uv run python -m src.main

# Run tests
pytest

# Run tests with coverage
pytest --cov=src --cov-report=term-missing

# Type check
mypy src

# Format
black src tests

# Lint
ruff check src tests
```

## Development Workflow

1. Read task from tasks.md
2. Write test first (should fail)
3. Implement feature
4. Verify test passes
5. Run code quality checks
6. Mark task complete in tasks.md

## Important Notes

- **No persistence**: Data lost when app exits (by design for Phase I)
- **Single-user**: No concurrency handling needed
- **Standard library only**: No external dependencies beyond dev tools
- **Menu-driven CLI**: Numbered options (1-6), simple input loop
- **Error handling**: Custom exceptions (TodoError, TaskNotFoundError, ValidationError)

## Next Phases (Future)

- Phase II: Full-stack web app (Next.js + FastAPI + Neon)
- Phase III: AI chatbot integration
- Phase IV: Kubernetes deployment
- Phase V: Cloud deployment with advanced features

## References

- Constitution: `/mnt/d/GitHub Connected/hackathon2/.specify/memory/constitution.md`
- Hackathon Brief: `/mnt/d/GitHub Connected/hackathon2/HACKATHON2.md`
