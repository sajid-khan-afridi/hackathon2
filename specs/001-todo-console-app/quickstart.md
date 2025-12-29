# Quickstart: Todo In-Memory Console App

**Feature**: 001-todo-console-app
**Date**: 2025-12-29

## Prerequisites

- Python 3.13+
- UV package manager (latest)

## Setup

### 1. Navigate to Phase 1 Directory

```bash
cd phase1
```

### 2. Create Virtual Environment with UV

```bash
uv venv
```

### 3. Activate Virtual Environment

**Linux/macOS:**
```bash
source .venv/bin/activate
```

**Windows:**
```powershell
.venv\Scripts\activate
```

### 4. Install Dependencies

```bash
uv pip install -e ".[dev]"
```

This installs:
- pytest (testing)
- pytest-cov (coverage)
- mypy (type checking)
- black (formatting)
- ruff (linting)

## Running the Application

```bash
uv run python -m src.main
```

Or with UV shorthand:
```bash
uv run src
```

## Running Tests

### Run All Tests
```bash
pytest
```

### Run with Coverage
```bash
pytest --cov=src --cov-report=term-missing
```

### Run with Coverage Threshold (80%)
```bash
pytest --cov=src --cov-report=term-missing --cov-fail-under=80
```

## Code Quality

### Format Code
```bash
black src tests
```

### Lint Code
```bash
ruff check src tests
```

### Type Check
```bash
mypy src
```

### Run All Checks
```bash
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
├── pyproject.toml
├── README.md
└── CLAUDE.md
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

Enter choice (1-6): 2

ID  Status      Description
──  ──────      ───────────
1   [ ]         Buy groceries

Enter choice (1-6): 3
Enter task ID to mark complete: 1
Task 1 marked as complete

Enter choice (1-6): 6
Goodbye!
```

## Troubleshooting

### Python Version Error
Ensure Python 3.13+ is installed:
```bash
python --version
```

### UV Not Found
Install UV:
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### Import Errors
Ensure you're in the phase1 directory and virtual environment is activated.
