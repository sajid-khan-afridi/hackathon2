# JWT Authentication Patterns

## Table of Contents

1. [Password Hashing](#password-hashing)
2. [JWT Token Management](#jwt-token-management)
3. [Auth Dependencies](#auth-dependencies)
4. [Auth Router](#auth-router)
5. [Protected Routes](#protected-routes)

## Password Hashing

```python
# src/services/auth.py
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)
```

## JWT Token Management

```python
# src/services/auth.py
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt

from ..config import settings


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.jwt_expire_minutes)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(
        to_encode,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )


def decode_access_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
        return payload
    except JWTError:
        return None
```

## Auth Dependencies

```python
# src/middleware/auth.py
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from ..database import get_session
from ..models.user import User
from ..services.auth import decode_access_token

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: AsyncSession = Depends(get_session),
) -> User:
    token = credentials.credentials
    payload = decode_access_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )

    statement = select(User).where(User.id == UUID(user_id))
    result = await session.exec(statement)
    user = result.first()

    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user
```

### Optional Auth Dependency

```python
async def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials | None = Depends(
        HTTPBearer(auto_error=False)
    ),
    session: AsyncSession = Depends(get_session),
) -> User | None:
    if credentials is None:
        return None
    try:
        return await get_current_user(credentials, session)
    except HTTPException:
        return None
```

## Auth Router

```python
# src/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from ..database import get_session
from ..models.user import User
from ..schemas.auth import LoginRequest, LoginResponse, RegisterRequest
from ..services.auth import create_access_token, hash_password, verify_password

router = APIRouter()


@router.post("/register", response_model=LoginResponse, status_code=status.HTTP_201_CREATED)
async def register(
    request: RegisterRequest,
    session: AsyncSession = Depends(get_session),
) -> dict:
    # Check if user exists
    statement = select(User).where(User.email == request.email)
    result = await session.exec(statement)
    if result.first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Create user
    user = User(
        email=request.email,
        hashed_password=hash_password(request.password),
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)

    # Generate token
    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/login", response_model=LoginResponse)
async def login(
    request: LoginRequest,
    session: AsyncSession = Depends(get_session),
) -> dict:
    # Find user
    statement = select(User).where(User.email == request.email)
    result = await session.exec(statement)
    user = result.first()

    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled",
        )

    # Generate token
    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}
```

## Protected Routes

### Basic Protection

```python
@router.get("/me")
async def get_current_user_info(
    current_user: User = Depends(get_current_user),
) -> dict:
    return {
        "id": current_user.id,
        "email": current_user.email,
        "is_active": current_user.is_active,
    }
```

### Role-Based Access (Optional Extension)

```python
from enum import Enum


class Role(str, Enum):
    USER = "user"
    ADMIN = "admin"


def require_role(required_role: Role):
    async def role_checker(
        current_user: User = Depends(get_current_user),
    ) -> User:
        if current_user.role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return current_user
    return role_checker


# Usage
@router.delete("/users/{user_id}")
async def delete_user(
    user_id: UUID,
    admin: User = Depends(require_role(Role.ADMIN)),
):
    ...
```
