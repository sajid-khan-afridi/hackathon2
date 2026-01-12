# Backend Authentication Patterns

Advanced FastAPI JWT verification patterns for Better Auth integration.

## JWT Token Structure

Better Auth JWT tokens contain:

```json
{
  "sub": "user-uuid-123",
  "email": "user@example.com",
  "name": "User Name",
  "iat": 1704067200,
  "exp": 1704672000
}
```

## Advanced Auth Middleware

### Full-Featured Token Verification

```python
# src/auth.py
from datetime import datetime, timezone
from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import ExpiredSignatureError, JWTError, jwt
from pydantic import BaseModel

from .config import settings


class AuthUser(BaseModel):
    """Authenticated user from JWT token."""

    id: str
    email: str
    name: str | None = None
    iat: datetime | None = None
    exp: datetime | None = None

    @property
    def is_expired(self) -> bool:
        """Check if token is expired."""
        if self.exp is None:
            return False
        return datetime.now(timezone.utc) > self.exp


class OptionalHTTPBearer(HTTPBearer):
    """Bearer auth that doesn't fail on missing token."""

    async def __call__(self, request: Request):
        try:
            return await super().__call__(request)
        except HTTPException:
            return None


# Required auth
security = HTTPBearer(
    scheme_name="Bearer",
    description="JWT token from Better Auth",
)

# Optional auth (for public endpoints that behave differently when authenticated)
optional_security = OptionalHTTPBearer(auto_error=False)


async def verify_token(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
) -> AuthUser:
    """
    Verify JWT token and return authenticated user.

    This is the main authentication dependency.
    Use: user: Annotated[AuthUser, Depends(verify_token)]
    """
    return await _decode_token(credentials.credentials)


async def verify_token_optional(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None,
        Depends(optional_security),
    ],
) -> AuthUser | None:
    """
    Optionally verify JWT token.

    Returns None if no token provided, user if valid token.
    Use for public endpoints that show extra data when authenticated.
    """
    if credentials is None:
        return None
    return await _decode_token(credentials.credentials)


async def _decode_token(token: str) -> AuthUser:
    """Decode and validate JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            token,
            settings.better_auth_secret,
            algorithms=[settings.jwt_algorithm],
            options={
                "verify_exp": True,
                "verify_iat": True,
                "require_exp": True,
                "require_iat": True,
            },
        )

        user_id = payload.get("sub")
        email = payload.get("email")

        if not user_id or not email:
            raise credentials_exception

        return AuthUser(
            id=user_id,
            email=email,
            name=payload.get("name"),
            iat=datetime.fromtimestamp(payload.get("iat", 0), tz=timezone.utc),
            exp=datetime.fromtimestamp(payload.get("exp", 0), tz=timezone.utc),
        )

    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )

    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


# Convenient alias
get_current_user = verify_token
get_current_user_optional = verify_token_optional
```

### Request Context with User

```python
# src/middleware/auth_context.py
from contextvars import ContextVar
from typing import Optional

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

from ..auth import AuthUser, _decode_token

# Context variable for current user
current_user_var: ContextVar[Optional[AuthUser]] = ContextVar(
    "current_user",
    default=None,
)


def get_current_user_from_context() -> AuthUser | None:
    """Get current user from request context."""
    return current_user_var.get()


class AuthContextMiddleware(BaseHTTPMiddleware):
    """
    Middleware that sets current user in context.

    Useful for accessing user in non-route code (e.g., logging, audit).
    """

    async def dispatch(self, request: Request, call_next):
        user = None

        # Extract token from header
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header[7:]
            try:
                user = await _decode_token(token)
            except Exception:
                pass  # Invalid token, user remains None

        # Set context
        token = current_user_var.set(user)
        try:
            response = await call_next(request)
            return response
        finally:
            current_user_var.reset(token)
```

## Route Patterns

### Protected Route with Type Hints

```python
from typing import Annotated

from fastapi import APIRouter, Depends

from ..auth import AuthUser, get_current_user

router = APIRouter()

# Type alias for cleaner code
CurrentUser = Annotated[AuthUser, Depends(get_current_user)]


@router.get("/me")
async def get_current_user_info(user: CurrentUser):
    """Get current user information."""
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
    }


@router.get("/tasks")
async def list_tasks(
    user: CurrentUser,
    session: AsyncSession = Depends(get_session),
):
    """List tasks for current user."""
    return await task_service.get_tasks(session, user.id)
```

### Mixed Public/Protected Endpoint

```python
from ..auth import AuthUser, get_current_user_optional

OptionalUser = Annotated[AuthUser | None, Depends(get_current_user_optional)]


@router.get("/tasks/{task_id}/public")
async def get_public_task(
    task_id: int,
    user: OptionalUser,
    session: AsyncSession = Depends(get_session),
):
    """
    Get task - shows extra info if authenticated.
    """
    task = await task_service.get_task_public(session, task_id)

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    response = {"id": task.id, "title": task.title}

    # Add extra info for authenticated users
    if user and task.user_id == user.id:
        response["is_owner"] = True
        response["description"] = task.description

    return response
```

### Router-Level Authentication

```python
from fastapi import APIRouter, Depends

from ..auth import get_current_user

# All routes in this router require authentication
router = APIRouter(
    prefix="/tasks",
    tags=["tasks"],
    dependencies=[Depends(get_current_user)],
)


@router.get("")
async def list_tasks():
    """Auth already verified by router dependency."""
    pass
```

## Testing Authentication

### Test Fixtures

```python
# tests/conftest.py
import pytest
from datetime import datetime, timedelta, timezone

from jose import jwt

from src.config import settings


@pytest.fixture
def test_user() -> dict:
    """Test user data."""
    return {
        "id": "test-user-123",
        "email": "test@example.com",
        "name": "Test User",
    }


@pytest.fixture
def auth_token(test_user: dict) -> str:
    """Generate valid JWT token for test user."""
    now = datetime.now(timezone.utc)
    payload = {
        "sub": test_user["id"],
        "email": test_user["email"],
        "name": test_user["name"],
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(hours=1)).timestamp()),
    }
    return jwt.encode(
        payload,
        settings.better_auth_secret,
        algorithm=settings.jwt_algorithm,
    )


@pytest.fixture
def expired_token(test_user: dict) -> str:
    """Generate expired JWT token."""
    now = datetime.now(timezone.utc)
    payload = {
        "sub": test_user["id"],
        "email": test_user["email"],
        "iat": int((now - timedelta(hours=2)).timestamp()),
        "exp": int((now - timedelta(hours=1)).timestamp()),
    }
    return jwt.encode(
        payload,
        settings.better_auth_secret,
        algorithm=settings.jwt_algorithm,
    )


@pytest.fixture
def auth_headers(auth_token: str) -> dict:
    """Headers with valid auth token."""
    return {"Authorization": f"Bearer {auth_token}"}
```

### Auth Tests

```python
# tests/test_auth.py
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestAuthentication:
    """Test authentication middleware."""

    async def test_protected_route_requires_auth(self, client: AsyncClient):
        """Test that protected routes require authentication."""
        response = await client.get("/api/tasks")
        assert response.status_code == 401
        assert "WWW-Authenticate" in response.headers

    async def test_protected_route_with_valid_token(
        self,
        client: AsyncClient,
        auth_headers: dict,
    ):
        """Test protected route accepts valid token."""
        response = await client.get("/api/tasks", headers=auth_headers)
        assert response.status_code == 200

    async def test_expired_token_rejected(
        self,
        client: AsyncClient,
        expired_token: str,
    ):
        """Test that expired tokens are rejected."""
        headers = {"Authorization": f"Bearer {expired_token}"}
        response = await client.get("/api/tasks", headers=headers)
        assert response.status_code == 401
        assert "expired" in response.json()["detail"].lower()

    async def test_invalid_token_rejected(self, client: AsyncClient):
        """Test that invalid tokens are rejected."""
        headers = {"Authorization": "Bearer invalid-token"}
        response = await client.get("/api/tasks", headers=headers)
        assert response.status_code == 401

    async def test_malformed_header_rejected(self, client: AsyncClient):
        """Test malformed Authorization header."""
        headers = {"Authorization": "NotBearer token"}
        response = await client.get("/api/tasks", headers=headers)
        assert response.status_code == 401


@pytest.mark.asyncio
class TestUserIsolation:
    """Test that users can only access their own data."""

    async def test_user_cannot_access_others_tasks(
        self,
        client: AsyncClient,
        auth_headers: dict,
        sample_task_other_user,  # Task owned by different user
    ):
        """User cannot access another user's task."""
        response = await client.get(
            f"/api/tasks/{sample_task_other_user.id}",
            headers=auth_headers,
        )
        assert response.status_code == 404
```

## Error Responses

### Standardized Auth Errors

```python
# src/auth.py
from enum import Enum


class AuthErrorCode(str, Enum):
    """Authentication error codes."""

    MISSING_TOKEN = "MISSING_TOKEN"
    INVALID_TOKEN = "INVALID_TOKEN"
    EXPIRED_TOKEN = "EXPIRED_TOKEN"
    INVALID_PAYLOAD = "INVALID_PAYLOAD"


def auth_error(code: AuthErrorCode, detail: str) -> HTTPException:
    """Create standardized auth error."""
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail={
            "code": code.value,
            "message": detail,
        },
        headers={"WWW-Authenticate": "Bearer"},
    )


# Usage
raise auth_error(AuthErrorCode.EXPIRED_TOKEN, "Token has expired")
```

## Security Best Practices

1. **Always use HTTPS** - Tokens in headers can be intercepted
2. **Short token expiry** - 7 days max, refresh regularly
3. **Validate all claims** - Check sub, email, exp, iat
4. **Log auth failures** - Monitor for attacks
5. **Rate limit auth endpoints** - Prevent brute force
6. **Never log tokens** - Sensitive data
