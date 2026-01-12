"""Contract tests for GET /api/{user_id}/tasks endpoint."""

from typing import Any

import pytest
from fastapi import status
from fastapi.testclient import TestClient
from sqlmodel import Session

from src.models import Task


class TestListTasks:
    """Tests for task listing endpoint."""

    def test_list_tasks_empty(
        self,
        authenticated_client: TestClient,
        test_user: dict[str, Any],
    ) -> None:
        """Test listing tasks when none exist."""
        response = authenticated_client.get(
            f"/api/{test_user['id']}/tasks",
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["success"] is True
        assert data["data"] == []

    def test_list_tasks_returns_user_tasks(
        self,
        authenticated_client: TestClient,
        test_user: dict[str, Any],
        session: Session,
    ) -> None:
        """Test listing tasks returns only the user's tasks."""
        # Create test tasks
        task1 = Task(user_id=test_user["id"], title="Task 1")
        task2 = Task(user_id=test_user["id"], title="Task 2")
        session.add(task1)
        session.add(task2)
        session.commit()

        response = authenticated_client.get(
            f"/api/{test_user['id']}/tasks",
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data["data"]) == 2
        titles = [t["title"] for t in data["data"]]
        assert "Task 1" in titles
        assert "Task 2" in titles

    def test_list_tasks_user_isolation(
        self,
        authenticated_client: TestClient,
        test_user: dict[str, Any],
        session: Session,
    ) -> None:
        """Test that users can only see their own tasks."""
        # Create tasks for different users
        my_task = Task(user_id=test_user["id"], title="My Task")
        other_task = Task(user_id="other-user-456", title="Other Task")
        session.add(my_task)
        session.add(other_task)
        session.commit()

        response = authenticated_client.get(
            f"/api/{test_user['id']}/tasks",
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data["data"]) == 1
        assert data["data"][0]["title"] == "My Task"

    def test_list_tasks_requires_auth(
        self,
        client: TestClient,
        test_user: dict[str, Any],
    ) -> None:
        """Test that listing tasks without auth returns 401."""
        response = client.get(f"/api/{test_user['id']}/tasks")

        # 401 Unauthorized - not authenticated
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_list_tasks_user_mismatch_returns_403(
        self,
        authenticated_client: TestClient,
        test_user: dict[str, Any],
    ) -> None:
        """Test that listing tasks for different user returns 403."""
        response = authenticated_client.get(
            "/api/different-user-id/tasks",
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN
