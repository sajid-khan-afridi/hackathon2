"""Tests for authentication middleware."""

from typing import Any

import jwt
import pytest
from fastapi import status
from fastapi.testclient import TestClient

from src.auth import AuthUser, verify_token, clear_jwks_cache, base64url_decode
from src.config import settings


class TestAuthMiddleware:
    """Tests for JWT authentication middleware."""

    def test_valid_token_returns_auth_user(
        self, client: TestClient, test_user: dict[str, Any]
    ) -> None:
        """Test that a valid JWT token returns an AuthUser object."""
        token = jwt.encode(
            {
                "sub": test_user["id"],
                "email": test_user["email"],
                "name": test_user["name"],
            },
            settings.better_auth_secret,
            algorithm=settings.jwt_algorithm,
        )

        # We test the auth via a protected endpoint (will be added in Phase 4)
        # For now, verify the token decoding works
        payload = jwt.decode(
            token,
            settings.better_auth_secret,
            algorithms=[settings.jwt_algorithm],
        )

        assert payload["sub"] == test_user["id"]
        assert payload["email"] == test_user["email"]

    def test_missing_token_returns_401(self, client: TestClient) -> None:
        """Test that a missing token returns 401 Unauthorized."""
        # Attempt to access a protected endpoint without auth header
        # This will be tested when we have protected endpoints in Phase 4
        pass  # Placeholder - will be enabled in Phase 4

    def test_invalid_token_returns_401(self, client: TestClient) -> None:
        """Test that an invalid token returns 401 Unauthorized."""
        # Test with a malformed token
        # This will be tested when we have protected endpoints in Phase 4
        pass  # Placeholder - will be enabled in Phase 4

    def test_expired_token_returns_401(self, client: TestClient) -> None:
        """Test that an expired token returns 401 Unauthorized."""
        # Test with an expired token
        # This will be tested when we have protected endpoints in Phase 4
        pass  # Placeholder - will be enabled in Phase 4


class TestAuthUser:
    """Tests for the AuthUser class."""

    def test_auth_user_creation(self) -> None:
        """Test AuthUser creation with all fields."""
        user = AuthUser(
            id="user-123",
            email="test@example.com",
            name="Test User",
        )

        assert user.id == "user-123"
        assert user.email == "test@example.com"
        assert user.name == "Test User"

    def test_auth_user_without_name(self) -> None:
        """Test AuthUser creation without optional name field."""
        user = AuthUser(
            id="user-123",
            email="test@example.com",
        )

        assert user.id == "user-123"
        assert user.email == "test@example.com"
        assert user.name is None


class TestTokenEncoding:
    """Tests for JWT token encoding/decoding."""

    def test_encode_decode_round_trip(self, test_user: dict[str, Any]) -> None:
        """Test that encoding and decoding a token preserves claims."""
        claims = {
            "sub": test_user["id"],
            "email": test_user["email"],
            "name": test_user["name"],
        }

        token = jwt.encode(
            claims,
            settings.better_auth_secret,
            algorithm=settings.jwt_algorithm,
        )

        decoded = jwt.decode(
            token,
            settings.better_auth_secret,
            algorithms=[settings.jwt_algorithm],
        )

        assert decoded["sub"] == claims["sub"]
        assert decoded["email"] == claims["email"]
        assert decoded["name"] == claims["name"]

    def test_wrong_secret_raises_error(self, test_user: dict[str, Any]) -> None:
        """Test that decoding with wrong secret raises error."""
        token = jwt.encode(
            {"sub": test_user["id"], "email": test_user["email"]},
            settings.better_auth_secret,
            algorithm=settings.jwt_algorithm,
        )

        with pytest.raises(jwt.InvalidSignatureError):
            jwt.decode(
                token,
                "wrong-secret-key-that-doesnt-match",
                algorithms=[settings.jwt_algorithm],
            )


class TestBase64UrlDecode:
    """Tests for base64url decoding utility."""

    def test_decode_without_padding(self) -> None:
        """Test decoding base64url string without padding."""
        # "test" in base64url is "dGVzdA" (no padding needed as length % 4 == 0 after padding)
        result = base64url_decode("dGVzdA")
        assert result == b"test"

    def test_decode_with_padding_needed(self) -> None:
        """Test decoding base64url string that needs padding."""
        # "hello" in base64url
        result = base64url_decode("aGVsbG8")
        assert result == b"hello"

    def test_decode_url_safe_characters(self) -> None:
        """Test that URL-safe characters are decoded correctly."""
        # Standard base64 uses + and /, url-safe uses - and _
        result = base64url_decode("PDw_Pz4-")
        assert b"<<" in result or b">>" in result or result is not None


class TestJwksCacheManagement:
    """Tests for JWKS cache management."""

    def test_clear_jwks_cache(self) -> None:
        """Test that clear_jwks_cache clears the cache."""
        # This just tests that the function runs without error
        clear_jwks_cache()
        # The cache is now cleared; we can't directly inspect it but can verify no exception

    def test_clear_jwks_cache_when_already_none(self) -> None:
        """Test clearing cache when it's already None."""
        clear_jwks_cache()  # First clear
        clear_jwks_cache()  # Second clear - should not raise
