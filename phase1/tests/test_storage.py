"""Unit tests for TaskStorage class"""

import pytest

from src.models import Task
from src.storage import TaskStorage


@pytest.fixture
def storage() -> TaskStorage:
    """Fresh storage instance for each test."""
    return TaskStorage()


@pytest.fixture
def sample_task() -> Task:
    """Task with known values for testing."""
    return Task(description="Test task", completed=False)


class TestTaskStorageAdd:
    """Test TaskStorage.add() method"""

    def test_add_assigns_id(self, storage: TaskStorage, sample_task: Task) -> None:
        """Test that add assigns an ID to the task"""
        result = storage.add(sample_task)
        assert result.id is not None
        assert result.id == 1

    def test_add_increments_id(self, storage: TaskStorage) -> None:
        """Test that IDs increment for each task"""
        task1 = Task(description="First task")
        task2 = Task(description="Second task")
        result1 = storage.add(task1)
        result2 = storage.add(task2)
        assert result1.id == 1
        assert result2.id == 2

    def test_add_returns_same_task(
        self, storage: TaskStorage, sample_task: Task
    ) -> None:
        """Test that add returns the same task instance"""
        result = storage.add(sample_task)
        assert result is sample_task


class TestTaskStorageGet:
    """Test TaskStorage.get() method"""

    def test_get_existing_task(self, storage: TaskStorage, sample_task: Task) -> None:
        """Test retrieving an existing task"""
        storage.add(sample_task)
        result = storage.get(1)
        assert result is not None
        assert result.description == "Test task"
        assert result.id == 1

    def test_get_nonexistent_task(self, storage: TaskStorage) -> None:
        """Test retrieving a non-existent task returns None"""
        result = storage.get(999)
        assert result is None

    def test_get_empty_storage(self, storage: TaskStorage) -> None:
        """Test get on empty storage returns None"""
        result = storage.get(1)
        assert result is None


class TestTaskStorageGetAll:
    """Test TaskStorage.get_all() method"""

    def test_get_all_empty(self, storage: TaskStorage) -> None:
        """Test get_all on empty storage returns empty list"""
        result = storage.get_all()
        assert result == []

    def test_get_all_single_task(self, storage: TaskStorage, sample_task: Task) -> None:
        """Test get_all with one task"""
        storage.add(sample_task)
        result = storage.get_all()
        assert len(result) == 1
        assert result[0].description == "Test task"

    def test_get_all_multiple_tasks(self, storage: TaskStorage) -> None:
        """Test get_all returns all tasks sorted by ID"""
        task1 = Task(description="First")
        task2 = Task(description="Second")
        task3 = Task(description="Third")
        storage.add(task1)
        storage.add(task2)
        storage.add(task3)
        result = storage.get_all()
        assert len(result) == 3
        assert result[0].id == 1
        assert result[1].id == 2
        assert result[2].id == 3

    def test_get_all_sorted_after_delete(self, storage: TaskStorage) -> None:
        """Test get_all maintains sort order after deletion"""
        task1 = Task(description="First")
        task2 = Task(description="Second")
        task3 = Task(description="Third")
        storage.add(task1)
        storage.add(task2)
        storage.add(task3)
        storage.delete(2)
        result = storage.get_all()
        assert len(result) == 2
        assert result[0].id == 1
        assert result[1].id == 3


class TestTaskStorageUpdate:
    """Test TaskStorage.update() method"""

    def test_update_existing_task(self, storage: TaskStorage) -> None:
        """Test updating an existing task"""
        original = Task(description="Original")
        storage.add(original)
        updated = Task(description="Updated", completed=True)
        result = storage.update(1, updated)
        assert result is not None
        assert result.description == "Updated"
        assert result.completed is True
        assert result.id == 1

    def test_update_nonexistent_task(self, storage: TaskStorage) -> None:
        """Test updating non-existent task returns None"""
        task = Task(description="Test")
        result = storage.update(999, task)
        assert result is None

    def test_update_preserves_id(self, storage: TaskStorage) -> None:
        """Test update assigns correct ID even if task has different ID"""
        original = Task(description="Original")
        storage.add(original)
        updated = Task(description="Updated", id=999)
        result = storage.update(1, updated)
        assert result is not None
        assert result.id == 1


class TestTaskStorageDelete:
    """Test TaskStorage.delete() method"""

    def test_delete_existing_task(
        self, storage: TaskStorage, sample_task: Task
    ) -> None:
        """Test deleting an existing task"""
        storage.add(sample_task)
        result = storage.delete(1)
        assert result is True
        assert storage.get(1) is None

    def test_delete_nonexistent_task(self, storage: TaskStorage) -> None:
        """Test deleting non-existent task returns False"""
        result = storage.delete(999)
        assert result is False

    def test_delete_id_not_reused(self, storage: TaskStorage) -> None:
        """Test that IDs are not reused after deletion"""
        task1 = Task(description="First")
        task2 = Task(description="Second")
        storage.add(task1)
        storage.delete(1)
        storage.add(task2)
        assert task2.id == 2  # ID should be 2, not 1
