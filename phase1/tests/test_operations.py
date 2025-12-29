"""Integration tests for business logic operations"""

import pytest

from src.models import TaskNotFoundError, ValidationError
from src.operations import add_task, delete_task, mark_complete, update_task, view_tasks
from src.storage import TaskStorage


@pytest.fixture
def storage() -> TaskStorage:
    """Fresh storage instance for each test."""
    return TaskStorage()


class TestAddTask:
    """Test add_task() operation (User Story 1)"""

    def test_add_task_success(self, storage: TaskStorage) -> None:
        """Test adding a task with valid description"""
        task = add_task(storage, "Buy groceries")
        assert task.id == 1
        assert task.description == "Buy groceries"
        assert task.completed is False

        # Verify task is in storage
        retrieved = storage.get(1)
        assert retrieved is not None
        assert retrieved.description == "Buy groceries"

    def test_add_task_empty_description(self, storage: TaskStorage) -> None:
        """Test adding a task with empty description raises ValidationError"""
        with pytest.raises(ValidationError) as exc_info:
            add_task(storage, "")
        assert "Description cannot be empty" in str(exc_info.value)

        # Verify no task was added
        assert len(storage.get_all()) == 0

    def test_add_task_whitespace_only_description(self, storage: TaskStorage) -> None:
        """Test adding a task with whitespace-only description raises ValidationError"""
        with pytest.raises(ValidationError) as exc_info:
            add_task(storage, "   ")
        assert "Description cannot be empty" in str(exc_info.value)

    def test_add_task_exceeds_max_length(self, storage: TaskStorage) -> None:
        """Test adding a task with description >500 chars raises ValidationError"""
        long_description = "a" * 501
        with pytest.raises(ValidationError) as exc_info:
            add_task(storage, long_description)
        assert "Description exceeds 500 characters" in str(exc_info.value)

        # Verify no task was added
        assert len(storage.get_all()) == 0

    def test_add_task_exactly_500_chars(self, storage: TaskStorage) -> None:
        """Test adding a task with exactly 500 chars is allowed"""
        description_500 = "a" * 500
        task = add_task(storage, description_500)
        assert task.description == description_500
        assert len(task.description) == 500

    def test_add_task_strips_whitespace(self, storage: TaskStorage) -> None:
        """Test that leading/trailing whitespace is stripped"""
        task = add_task(storage, "  Buy groceries  ")
        assert task.description == "Buy groceries"

    def test_add_multiple_tasks_unique_ids(self, storage: TaskStorage) -> None:
        """Test adding multiple tasks assigns unique incrementing IDs"""
        task1 = add_task(storage, "First task")
        task2 = add_task(storage, "Second task")
        task3 = add_task(storage, "Third task")
        assert task1.id == 1
        assert task2.id == 2
        assert task3.id == 3


class TestViewTasks:
    """Test view_tasks() operation (User Story 2)"""

    def test_view_tasks_with_tasks(self, storage: TaskStorage) -> None:
        """Test viewing tasks when tasks exist"""
        add_task(storage, "Buy groceries")
        add_task(storage, "Call mom")
        add_task(storage, "Finish report")

        output = view_tasks(storage)

        # Verify output contains task data
        assert "Buy groceries" in output
        assert "Call mom" in output
        assert "Finish report" in output
        assert "1" in output  # Task IDs
        assert "2" in output
        assert "3" in output

    def test_view_tasks_empty_list(self, storage: TaskStorage) -> None:
        """Test viewing tasks when list is empty"""
        output = view_tasks(storage)
        assert "No tasks found" in output or "Add a task to get started" in output

    def test_view_tasks_with_mixed_statuses(self, storage: TaskStorage) -> None:
        """Test viewing tasks with complete and incomplete statuses"""
        add_task(storage, "Incomplete task")
        task2 = add_task(storage, "Complete task")
        task2.completed = True
        storage.update(task2.id, task2)  # type: ignore

        output = view_tasks(storage)

        # Verify both tasks are shown
        assert "Incomplete task" in output
        assert "Complete task" in output

        # Verify status indicators are present
        assert "[ ]" in output or "incomplete" in output.lower()
        assert "[✓]" in output or "✓" in output or "complete" in output.lower()

    def test_view_tasks_displays_ids(self, storage: TaskStorage) -> None:
        """Test that view_tasks displays task IDs"""
        add_task(storage, "Task one")
        add_task(storage, "Task two")

        output = view_tasks(storage)

        # Verify IDs are displayed
        assert "1" in output
        assert "2" in output

    def test_view_tasks_ordered_by_id(self, storage: TaskStorage) -> None:
        """Test that tasks are displayed in ID order"""
        add_task(storage, "First")
        add_task(storage, "Second")
        add_task(storage, "Third")

        output = view_tasks(storage)

        # Find positions of task descriptions
        first_pos = output.find("First")
        second_pos = output.find("Second")
        third_pos = output.find("Third")

        # Verify they appear in order
        assert first_pos < second_pos < third_pos


class TestMarkComplete:
    """Test mark_complete() operation (User Story 3)"""

    def test_mark_complete_success(self, storage: TaskStorage) -> None:
        """Test marking a task as complete"""
        task = add_task(storage, "Test task")
        assert task.completed is False

        mark_complete(storage, task.id)  # type: ignore

        updated = storage.get(task.id)  # type: ignore
        assert updated is not None
        assert updated.completed is True

    def test_mark_complete_already_complete(self, storage: TaskStorage) -> None:
        """Test marking an already complete task (no-op, no error)"""
        task = add_task(storage, "Test task")
        mark_complete(storage, task.id)  # type: ignore
        mark_complete(storage, task.id)  # type: ignore  # Should not raise

        updated = storage.get(task.id)  # type: ignore
        assert updated is not None
        assert updated.completed is True

    def test_mark_complete_invalid_id(self, storage: TaskStorage) -> None:
        """Test marking non-existent task raises TaskNotFoundError"""
        with pytest.raises(TaskNotFoundError) as exc_info:
            mark_complete(storage, 999)
        assert exc_info.value.task_id == 999


class TestUpdateTask:
    """Test update_task() operation (User Story 4)"""

    def test_update_task_success(self, storage: TaskStorage) -> None:
        """Test updating task description"""
        task = add_task(storage, "Original description")
        update_task(storage, task.id, "Updated description")  # type: ignore

        updated = storage.get(task.id)  # type: ignore
        assert updated is not None
        assert updated.description == "Updated description"

    def test_update_task_preserves_completion_status(
        self, storage: TaskStorage
    ) -> None:
        """Test that update preserves completion status"""
        task = add_task(storage, "Test task")
        mark_complete(storage, task.id)  # type: ignore

        update_task(storage, task.id, "New description")  # type: ignore

        updated = storage.get(task.id)  # type: ignore
        assert updated is not None
        assert updated.description == "New description"
        assert updated.completed is True  # Status preserved

    def test_update_task_invalid_id(self, storage: TaskStorage) -> None:
        """Test updating non-existent task raises TaskNotFoundError"""
        with pytest.raises(TaskNotFoundError):
            update_task(storage, 999, "New description")

    def test_update_task_empty_description(self, storage: TaskStorage) -> None:
        """Test updating with empty description raises ValidationError"""
        task = add_task(storage, "Original")
        with pytest.raises(ValidationError) as exc_info:
            update_task(storage, task.id, "")  # type: ignore
        assert "Description cannot be empty" in str(exc_info.value)

        # Original description should be retained
        unchanged = storage.get(task.id)  # type: ignore
        assert unchanged is not None
        assert unchanged.description == "Original"


class TestDeleteTask:
    """Test delete_task() operation (User Story 5)"""

    def test_delete_task_success(self, storage: TaskStorage) -> None:
        """Test deleting a task"""
        task = add_task(storage, "Test task")
        delete_task(storage, task.id)  # type: ignore

        deleted = storage.get(task.id)  # type: ignore
        assert deleted is None

    def test_delete_task_invalid_id(self, storage: TaskStorage) -> None:
        """Test deleting non-existent task raises TaskNotFoundError"""
        with pytest.raises(TaskNotFoundError):
            delete_task(storage, 999)

    def test_delete_task_id_not_reused(self, storage: TaskStorage) -> None:
        """Test that IDs are not reused after deletion"""
        task1 = add_task(storage, "First")
        delete_task(storage, task1.id)  # type: ignore

        task2 = add_task(storage, "Second")
        assert task2.id == 2  # Should be 2, not 1
