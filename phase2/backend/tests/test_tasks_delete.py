"""Contract tests for DELETE /api/{user_id}/tasks/{task_id} endpoint."""

from typing import Any

import pytest
from fastapi import status
from fastapi.testclient import TestClient
from sqlmodel import Session

from src.models import Task


class TestDeleteTask:
    """Tests for deleting a task endpoint."""

    def test_delete_task_success(
        self,
        authenticated_client: TestClient,
        test_user: dict[str, Any],
        session: Session,
    ) -> None:
        """Test successfully deleting a task."""
        task = Task(user_id=test_user["id"], title="To Delete")
        session.add(task)
        session.commit()
        session.refresh(task)
        task_id = task.id

        response = authenticated_client.delete(
            f"/api/{test_user['id']}/tasks/{task_id}",
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["success"] is True

        # Verify task is deleted
        deleted = session.get(Task, task_id)
        assert deleted is None

    def test_delete_task_nonexistent(
        self,
        authenticated_client: TestClient,
        test_user: dict[str, Any],
    ) -> None:
        """Test deleting a task that doesn't exist."""
        response = authenticated_client.delete(
            f"/api/{test_user['id']}/tasks/99999",
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_delete_other_user_task(
        self,
        authenticated_client: TestClient,
        test_user: dict[str, Any],
        session: Session,
    ) -> None:
        """Test that you can't delete another user's task."""
        task = Task(user_id="other-user-456", title="Other's Task")
        session.add(task)
        session.commit()
        session.refresh(task)

        response = authenticated_client.delete(
            f"/api/{test_user['id']}/tasks/{task.id}",
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_delete_requires_auth(
        self,
        client: TestClient,
        test_user: dict[str, Any],
    ) -> None:
        """Test that deleting task without auth returns 401."""
        response = client.delete(f"/api/{test_user['id']}/tasks/1")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_delete_user_mismatch_returns_403(
        self,
        authenticated_client: TestClient,
        test_user: dict[str, Any],
    ) -> None:
        """Test that deleting task for different user returns 403."""
        response = authenticated_client.delete(
            "/api/different-user-id/tasks/1",
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN
