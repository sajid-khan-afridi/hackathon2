"""Tests for health endpoint."""

from fastapi.testclient import TestClient


def test_health_check_returns_healthy(client: TestClient) -> None:
    """Test that health check returns healthy status."""
    response = client.get("/health")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "timestamp" in data


def test_health_check_has_valid_timestamp(client: TestClient) -> None:
    """Test that health check timestamp is valid ISO format."""
    from datetime import datetime

    response = client.get("/health")
    data = response.json()

    # Should not raise exception for valid ISO timestamp
    timestamp = datetime.fromisoformat(data["timestamp"].replace("Z", "+00:00"))
    assert timestamp is not None


def test_root_endpoint_returns_info(client: TestClient) -> None:
    """Test that root endpoint returns API info."""
    response = client.get("/")

    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "docs" in data
    assert "health" in data
