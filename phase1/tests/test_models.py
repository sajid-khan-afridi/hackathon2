"""Unit tests for Task model and exceptions"""

import pytest

from src.models import Task, TaskNotFoundError, TodoError, ValidationError


class TestTask:
    """Test Task dataclass"""

    def test_task_creation_default_values(self) -> None:
        """Test task created with default values"""
        task = Task(description="Buy groceries")
        assert task.description == "Buy groceries"
        assert task.completed is False
        assert task.id is None

    def test_task_creation_with_values(self) -> None:
        """Test task created with explicit values"""
        task = Task(description="Call mom", completed=True, id=1)
        assert task.description == "Call mom"
        assert task.completed is True
        assert task.id == 1

    def test_task_description_required(self) -> None:
        """Test that description is required"""
        with pytest.raises(TypeError):
            Task()  # type: ignore

    def test_task_can_modify_completed(self) -> None:
        """Test that completed status can be changed"""
        task = Task(description="Test task")
        task.completed = True
        assert task.completed is True

    def test_task_can_assign_id(self) -> None:
        """Test that ID can be assigned after creation"""
        task = Task(description="Test task")
        task.id = 42
        assert task.id == 42


class TestExceptions:
    """Test custom exception classes"""

    def test_todo_error_is_exception(self) -> None:
        """Test TodoError is an Exception"""
        error = TodoError("test error")
        assert isinstance(error, Exception)
        assert str(error) == "test error"

    def test_task_not_found_error(self) -> None:
        """Test TaskNotFoundError stores task_id"""
        error = TaskNotFoundError(task_id=123)
        assert isinstance(error, TodoError)
        assert error.task_id == 123
        assert str(error) == "Task 123 not found"

    def test_validation_error(self) -> None:
        """Test ValidationError with custom message"""
        error = ValidationError("Description cannot be empty")
        assert isinstance(error, TodoError)
        assert str(error) == "Description cannot be empty"
