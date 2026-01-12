"""Contract tests for POST /api/{user_id}/tasks endpoint."""

from typing import Any

import pytest
from fastapi import status
from fastapi.testclient import TestClient


class TestCreateTask:
    """Tests for task creation endpoint."""

    def test_create_task_with_title_only(
        self,
        authenticated_client: TestClient,
        test_user: dict[str, Any],
    ) -> None:
        """Test creating a task with only a title."""
        response = authenticated_client.post(
            f"/api/{test_user['id']}/tasks",
            json={"title": "Buy groceries"},
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["success"] is True
        assert data["data"]["title"] == "Buy groceries"
        assert data["data"]["description"] is None
        assert data["data"]["completed"] is False
        assert "id" in data["data"]
        assert "created_at" in data["data"]
        assert "updated_at" in data["data"]

    def test_create_task_with_description(
        self,
        authenticated_client: TestClient,
        test_user: dict[str, Any],
    ) -> None:
        """Test creating a task with title and description."""
        response = authenticated_client.post(
            f"/api/{test_user['id']}/tasks",
            json={
                "title": "Buy groceries",
                "description": "Milk, eggs, bread",
            },
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["data"]["title"] == "Buy groceries"
        assert data["data"]["description"] == "Milk, eggs, bread"

    def test_create_task_validates_empty_title(
        self,
        authenticated_client: TestClient,
        test_user: dict[str, Any],
    ) -> None:
        """Test that empty title returns validation error."""
        response = authenticated_client.post(
            f"/api/{test_user['id']}/tasks",
            json={"title": ""},
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_create_task_validates_title_too_long(
        self,
        authenticated_client: TestClient,
        test_user: dict[str, Any],
    ) -> None:
        """Test that title over 200 chars returns validation error."""
        response = authenticated_client.post(
            f"/api/{test_user['id']}/tasks",
            json={"title": "x" * 201},
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_create_task_requires_auth(
        self,
        client: TestClient,
        test_user: dict[str, Any],
    ) -> None:
        """Test that creating task without auth returns 401."""
        response = client.post(
            f"/api/{test_user['id']}/tasks",
            json={"title": "Test task"},
        )

        # 401 Unauthorized - not authenticated
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_create_task_user_mismatch_returns_403(
        self,
        authenticated_client: TestClient,
        test_user: dict[str, Any],
    ) -> None:
        """Test that creating task for different user returns 403."""
        response = authenticated_client.post(
            "/api/different-user-id/tasks",
            json={"title": "Test task"},
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN
