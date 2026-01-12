"""JWT authentication middleware using JWKS from Better Auth."""

from typing import Annotated

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import jwt
from cryptography.hazmat.primitives.asymmetric import ed25519
import base64

from .config import settings

# Security scheme for Swagger UI
security = HTTPBearer()

# JWKS cache
_jwks_cache: dict | None = None


class AuthUser:
    """Authenticated user from JWT token."""

    def __init__(self, id: str, email: str, name: str | None = None) -> None:
        self.id = id
        self.email = email
        self.name = name


async def get_jwks() -> dict:
    """Fetch JWKS from Better Auth endpoint."""
    global _jwks_cache
    if _jwks_cache is not None:
        return _jwks_cache

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.frontend_url}/api/auth/jwks",
                timeout=10.0,
            )
            response.raise_for_status()
            _jwks_cache = response.json()
            return _jwks_cache
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Failed to fetch JWKS: {str(e)}",
        )


def clear_jwks_cache() -> None:
    """Clear the JWKS cache (useful for testing or key rotation)."""
    global _jwks_cache
    _jwks_cache = None


def base64url_decode(data: str) -> bytes:
    """Decode base64url data."""
    # Add padding if necessary
    padding = 4 - len(data) % 4
    if padding != 4:
        data += "=" * padding
    return base64.urlsafe_b64decode(data)


async def verify_token(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
) -> AuthUser:
    """
    Verify JWT token using JWKS and return authenticated user.

    Raises:
        HTTPException: If token is invalid or expired
    """
    token = credentials.credentials

    try:
        # Get unverified header to find algorithm and key ID
        unverified_header = jwt.get_unverified_header(token)
        alg = unverified_header.get("alg", "EdDSA")
        kid = unverified_header.get("kid")

        # Fetch JWKS
        jwks = await get_jwks()

        # Find the matching key
        key_data = None
        for k in jwks.get("keys", []):
            if kid and k.get("kid") == kid:
                key_data = k
                break
            elif not kid:
                # If no kid in token, use first key
                key_data = k
                break

        if not key_data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="No matching key found in JWKS",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Handle EdDSA (Ed25519) keys
        if alg == "EdDSA" and key_data.get("kty") == "OKP" and key_data.get("crv") == "Ed25519":
            # Decode the public key from JWKS
            x = base64url_decode(key_data["x"])
            public_key = ed25519.Ed25519PublicKey.from_public_bytes(x)

            payload = jwt.decode(
                token,
                public_key,
                algorithms=["EdDSA"],
                options={"verify_aud": False},
            )
        elif alg in ["RS256", "RS384", "RS512"]:
            # For RSA, use PyJWKClient
            from jwt import PyJWKClient
            jwks_client = PyJWKClient(f"{settings.frontend_url}/api/auth/jwks")
            signing_key = jwks_client.get_signing_key_from_jwt(token)
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=[alg],
                options={"verify_aud": False},
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Unsupported algorithm: {alg}",
                headers={"WWW-Authenticate": "Bearer"},
            )

        user_id = payload.get("sub")
        email = payload.get("email")

        if not user_id or not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return AuthUser(
            id=user_id,
            email=email,
            name=payload.get("name"),
        )

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token validation failed: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication error: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


# Dependency for protected routes
get_current_user = verify_token
