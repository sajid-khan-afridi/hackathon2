"""Contract tests for PATCH /api/{user_id}/tasks/{task_id}/complete endpoint."""

from typing import Any

import pytest
from fastapi import status
from fastapi.testclient import TestClient
from sqlmodel import Session

from src.models import Task


class TestToggleTaskComplete:
    """Tests for toggling task completion status."""

    def test_toggle_complete_uncompleted_task(
        self,
        authenticated_client: TestClient,
        test_user: dict[str, Any],
        session: Session,
    ) -> None:
        """Test toggling an uncompleted task to completed."""
        task = Task(user_id=test_user["id"], title="Test", completed=False)
        session.add(task)
        session.commit()
        session.refresh(task)

        response = authenticated_client.patch(
            f"/api/{test_user['id']}/tasks/{task.id}/complete",
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["data"]["completed"] is True

    def test_toggle_complete_completed_task(
        self,
        authenticated_client: TestClient,
        test_user: dict[str, Any],
        session: Session,
    ) -> None:
        """Test toggling a completed task to uncompleted."""
        task = Task(user_id=test_user["id"], title="Test", completed=True)
        session.add(task)
        session.commit()
        session.refresh(task)

        response = authenticated_client.patch(
            f"/api/{test_user['id']}/tasks/{task.id}/complete",
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["data"]["completed"] is False

    def test_toggle_complete_updates_timestamp(
        self,
        authenticated_client: TestClient,
        test_user: dict[str, Any],
        session: Session,
    ) -> None:
        """Test that toggle updates the updated_at timestamp."""
        task = Task(user_id=test_user["id"], title="Test")
        session.add(task)
        session.commit()
        session.refresh(task)

        response = authenticated_client.patch(
            f"/api/{test_user['id']}/tasks/{task.id}/complete",
        )

        assert response.status_code == status.HTTP_200_OK
        assert "updated_at" in response.json()["data"]

    def test_toggle_complete_nonexistent_task(
        self,
        authenticated_client: TestClient,
        test_user: dict[str, Any],
    ) -> None:
        """Test toggling a task that doesn't exist."""
        response = authenticated_client.patch(
            f"/api/{test_user['id']}/tasks/99999/complete",
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_toggle_complete_other_user_task(
        self,
        authenticated_client: TestClient,
        test_user: dict[str, Any],
        session: Session,
    ) -> None:
        """Test that you can't toggle another user's task."""
        task = Task(user_id="other-user-456", title="Other's Task")
        session.add(task)
        session.commit()
        session.refresh(task)

        response = authenticated_client.patch(
            f"/api/{test_user['id']}/tasks/{task.id}/complete",
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_toggle_complete_requires_auth(
        self,
        client: TestClient,
        test_user: dict[str, Any],
    ) -> None:
        """Test that toggling task without auth returns 401."""
        response = client.patch(f"/api/{test_user['id']}/tasks/1/complete")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_toggle_complete_user_mismatch_returns_403(
        self,
        authenticated_client: TestClient,
        test_user: dict[str, Any],
    ) -> None:
        """Test that toggling task for different user returns 403."""
        response = authenticated_client.patch(
            "/api/different-user-id/tasks/1/complete",
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN
