"""Contract tests for GET /api/{user_id}/tasks/{task_id} endpoint."""

from typing import Any

import pytest
from fastapi import status
from fastapi.testclient import TestClient
from sqlmodel import Session

from src.models import Task


class TestGetTask:
    """Tests for getting a single task endpoint."""

    def test_get_task_success(
        self,
        authenticated_client: TestClient,
        test_user: dict[str, Any],
        session: Session,
    ) -> None:
        """Test getting a task by ID."""
        task = Task(
            user_id=test_user["id"],
            title="Test Task",
            description="Test description",
        )
        session.add(task)
        session.commit()
        session.refresh(task)

        response = authenticated_client.get(
            f"/api/{test_user['id']}/tasks/{task.id}",
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["success"] is True
        assert data["data"]["id"] == task.id
        assert data["data"]["title"] == "Test Task"
        assert data["data"]["description"] == "Test description"
        assert data["data"]["completed"] is False

    def test_get_completed_task(
        self,
        authenticated_client: TestClient,
        test_user: dict[str, Any],
        session: Session,
    ) -> None:
        """Test getting a completed task."""
        task = Task(
            user_id=test_user["id"],
            title="Completed Task",
            completed=True,
        )
        session.add(task)
        session.commit()
        session.refresh(task)

        response = authenticated_client.get(
            f"/api/{test_user['id']}/tasks/{task.id}",
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["data"]["completed"] is True

    def test_get_task_nonexistent(
        self,
        authenticated_client: TestClient,
        test_user: dict[str, Any],
    ) -> None:
        """Test getting a task that doesn't exist."""
        response = authenticated_client.get(
            f"/api/{test_user['id']}/tasks/99999",
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_get_other_user_task(
        self,
        authenticated_client: TestClient,
        test_user: dict[str, Any],
        session: Session,
    ) -> None:
        """Test that you can't get another user's task."""
        task = Task(
            user_id="other-user-456",
            title="Other User's Task",
        )
        session.add(task)
        session.commit()
        session.refresh(task)

        response = authenticated_client.get(
            f"/api/{test_user['id']}/tasks/{task.id}",
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_get_task_requires_auth(
        self,
        client: TestClient,
        test_user: dict[str, Any],
    ) -> None:
        """Test that getting task without auth returns 401."""
        response = client.get(f"/api/{test_user['id']}/tasks/1")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_get_task_user_mismatch_returns_403(
        self,
        authenticated_client: TestClient,
        test_user: dict[str, Any],
    ) -> None:
        """Test that getting task for different user returns 403."""
        response = authenticated_client.get(
            "/api/different-user-id/tasks/1",
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN
