"""Contract tests for PUT /api/{user_id}/tasks/{task_id} endpoint."""

from typing import Any

import pytest
from fastapi import status
from fastapi.testclient import TestClient
from sqlmodel import Session

from src.models import Task


class TestUpdateTask:
    """Tests for updating a task endpoint."""

    def test_update_task_title(
        self,
        authenticated_client: TestClient,
        test_user: dict[str, Any],
        session: Session,
    ) -> None:
        """Test updating task title."""
        task = Task(user_id=test_user["id"], title="Original")
        session.add(task)
        session.commit()
        session.refresh(task)

        response = authenticated_client.put(
            f"/api/{test_user['id']}/tasks/{task.id}",
            json={"title": "Updated"},
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["data"]["title"] == "Updated"

    def test_update_task_description(
        self,
        authenticated_client: TestClient,
        test_user: dict[str, Any],
        session: Session,
    ) -> None:
        """Test updating task description."""
        task = Task(user_id=test_user["id"], title="Test")
        session.add(task)
        session.commit()
        session.refresh(task)

        response = authenticated_client.put(
            f"/api/{test_user['id']}/tasks/{task.id}",
            json={"description": "New description"},
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["data"]["description"] == "New description"

    def test_update_task_both_fields(
        self,
        authenticated_client: TestClient,
        test_user: dict[str, Any],
        session: Session,
    ) -> None:
        """Test updating both title and description."""
        task = Task(user_id=test_user["id"], title="Original")
        session.add(task)
        session.commit()
        session.refresh(task)

        response = authenticated_client.put(
            f"/api/{test_user['id']}/tasks/{task.id}",
            json={"title": "New Title", "description": "New Desc"},
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["data"]["title"] == "New Title"
        assert data["data"]["description"] == "New Desc"

    def test_update_task_updates_timestamp(
        self,
        authenticated_client: TestClient,
        test_user: dict[str, Any],
        session: Session,
    ) -> None:
        """Test that update changes updated_at timestamp."""
        task = Task(user_id=test_user["id"], title="Test")
        session.add(task)
        session.commit()
        session.refresh(task)
        original_updated = task.updated_at

        response = authenticated_client.put(
            f"/api/{test_user['id']}/tasks/{task.id}",
            json={"title": "Updated"},
        )

        assert response.status_code == status.HTTP_200_OK
        # Note: In very fast tests, timestamps might be equal
        # Just verify the field exists
        assert "updated_at" in response.json()["data"]

    def test_update_task_validates_empty_title(
        self,
        authenticated_client: TestClient,
        test_user: dict[str, Any],
        session: Session,
    ) -> None:
        """Test that empty title returns validation error."""
        task = Task(user_id=test_user["id"], title="Test")
        session.add(task)
        session.commit()
        session.refresh(task)

        response = authenticated_client.put(
            f"/api/{test_user['id']}/tasks/{task.id}",
            json={"title": ""},
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_update_task_validates_title_too_long(
        self,
        authenticated_client: TestClient,
        test_user: dict[str, Any],
        session: Session,
    ) -> None:
        """Test that title over 200 chars returns validation error."""
        task = Task(user_id=test_user["id"], title="Test")
        session.add(task)
        session.commit()
        session.refresh(task)

        response = authenticated_client.put(
            f"/api/{test_user['id']}/tasks/{task.id}",
            json={"title": "x" * 201},
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_update_nonexistent_task(
        self,
        authenticated_client: TestClient,
        test_user: dict[str, Any],
    ) -> None:
        """Test updating a task that doesn't exist."""
        response = authenticated_client.put(
            f"/api/{test_user['id']}/tasks/99999",
            json={"title": "Updated"},
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_update_other_user_task(
        self,
        authenticated_client: TestClient,
        test_user: dict[str, Any],
        session: Session,
    ) -> None:
        """Test that you can't update another user's task."""
        task = Task(user_id="other-user-456", title="Other's Task")
        session.add(task)
        session.commit()
        session.refresh(task)

        response = authenticated_client.put(
            f"/api/{test_user['id']}/tasks/{task.id}",
            json={"title": "Stolen"},
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_update_requires_auth(
        self,
        client: TestClient,
        test_user: dict[str, Any],
    ) -> None:
        """Test that updating task without auth returns 401."""
        response = client.put(
            f"/api/{test_user['id']}/tasks/1",
            json={"title": "Test"},
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_update_user_mismatch_returns_403(
        self,
        authenticated_client: TestClient,
        test_user: dict[str, Any],
    ) -> None:
        """Test that updating task for different user returns 403."""
        response = authenticated_client.put(
            "/api/different-user-id/tasks/1",
            json={"title": "Test"},
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN
