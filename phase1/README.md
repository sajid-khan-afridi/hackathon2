# Todo Console App - Phase I

A simple in-memory todo list manager with CLI interface.

## Features

- ✅ Add new todo tasks
- ✅ View all tasks with status
- ✅ Mark tasks as complete
- ✅ Update task descriptions
- ✅ Delete tasks
- ✅ In-memory storage (no persistence)

## Prerequisites

- Python 3.13+
- UV package manager

## Quick Start

### 1. Setup Environment

```bash
cd phase1
uv venv
source .venv/bin/activate  # Linux/macOS
# OR
.venv\Scripts\activate     # Windows
```

### 2. Install Dependencies

```bash
uv pip install -e ".[dev]"
```

### 3. Run Application

```bash
uv run python -m src.main
```

### 4. Run Tests

```bash
pytest --cov=src --cov-report=term-missing --cov-fail-under=80
```

## Development

### Code Quality

```bash
# Format code
black src tests

# Lint code
ruff check src tests

# Type check
mypy src

# Run all checks
black src tests && ruff check src tests && mypy src && pytest --cov=src --cov-fail-under=80
```

## Project Structure

```
phase1/
├── src/
│   ├── __init__.py       # Package marker
│   ├── main.py           # CLI entry point
│   ├── models.py         # Task dataclass
│   ├── storage.py        # In-memory storage
│   └── operations.py     # Business logic
├── tests/
│   ├── __init__.py
│   ├── test_models.py
│   ├── test_storage.py
│   └── test_operations.py
├── pyproject.toml        # Project configuration
├── README.md             # This file
└── CLAUDE.md             # AI agent instructions
```

## Usage Example

```
=== Todo App ===
1. Add Task
2. View Tasks
3. Mark Complete
4. Update Task
5. Delete Task
6. Exit

Enter choice (1-6): 1
Enter task description: Buy groceries
Task added with ID: 1
```

## Technical Details

- **Language**: Python 3.13+
- **Storage**: In-memory (dict-based)
- **Testing**: pytest with 80% coverage requirement
- **Validation**: Max 500 chars per task, non-empty descriptions
- **Performance**: <5s per operation, supports 10,000+ tasks

## License

Part of the Hackathon 2 project.
