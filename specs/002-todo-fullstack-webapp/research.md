# Research: Todo Full-Stack Web Application

**Feature**: 002-todo-fullstack-webapp
**Date**: 2025-12-29
**Status**: Complete

## Research Summary

This document captures research findings for the Phase II full-stack web application, resolving all technical unknowns identified during planning.

---

## 1. Better Auth + FastAPI Integration

### Decision
Use Better Auth JWT plugin on the frontend (Next.js) with JWKS-based verification on the FastAPI backend.

### Rationale
- Better Auth natively supports JWT tokens via the `jwt()` plugin
- FastAPI can verify JWTs using the public keys from Better Auth's JWKS endpoint
- No shared database connection required between frontend auth and backend API
- Industry-standard RS256 asymmetric signing ensures security

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Session-based auth with shared DB | Requires backend to access Better Auth's session store; tight coupling |
| OAuth2 password flow | Better Auth doesn't expose password grant; designed for web flows |
| API key authentication | Less secure; no user identity association |

### Implementation Pattern

**Frontend (Better Auth config):**
```typescript
import { betterAuth } from "better-auth"
import { jwt } from "better-auth/plugins"

export const auth = betterAuth({
    plugins: [
        jwt({
            jwt: {
                issuer: process.env.BETTER_AUTH_URL,
                expirationTime: "7d"
            }
        })
    ]
})
```

**Backend (FastAPI JWT verification):**
```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from typing import Dict

security = HTTPBearer()

async def verify_jwt_token(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Dict[str, str]:
    token = credentials.credentials
    try:
        # Verify using JWKS public key
        payload = jwt.decode(token, options={"verify_signature": True})
        return {"user_id": payload["sub"], "email": payload.get("email")}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
```

---

## 2. SQLModel with Neon PostgreSQL

### Decision
Use SQLModel as the ORM with async support via `asyncpg` driver connecting to Neon Serverless PostgreSQL.

### Rationale
- SQLModel combines Pydantic validation with SQLAlchemy ORM
- Native FastAPI integration with automatic request/response validation
- Neon provides serverless PostgreSQL with connection pooling
- Type hints enable IDE autocompletion and error checking

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Raw SQLAlchemy | More verbose; requires separate Pydantic models |
| Tortoise ORM | Less mature; smaller community |
| Prisma (Python) | Early stage; TypeScript-focused |

### Implementation Pattern

**Database connection:**
```python
from sqlmodel import SQLModel, create_engine, Session
from contextlib import contextmanager

DATABASE_URL = "postgresql://user:pass@host/db?sslmode=require"
engine = create_engine(DATABASE_URL, pool_size=10, max_overflow=5)

def get_session():
    with Session(engine) as session:
        yield session
```

**Model definition:**
```python
from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional

class Task(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)
    title: str = Field(max_length=200)
    description: Optional[str] = Field(default=None, max_length=2000)
    completed: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
```

---

## 3. Next.js App Router Architecture

### Decision
Use Next.js 16+ with App Router, server components by default, and API routes as a proxy to FastAPI.

### Rationale
- App Router provides better layouts, loading states, and error handling
- Server components reduce client bundle size
- API routes proxy pattern keeps FastAPI URL private from browser
- Better Auth integrates seamlessly with App Router

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Pages Router | Legacy; App Router is the recommended approach |
| Direct browser-to-FastAPI | Exposes backend URL; CORS complexity |
| Next.js API routes only | Misses FastAPI's OpenAPI generation and Python ecosystem |

### Implementation Pattern

**API Route proxy (Next.js):**
```typescript
// app/api/[user_id]/tasks/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { user_id: string } }
) {
  const token = request.headers.get('authorization')
  const response = await fetch(
    `${process.env.BACKEND_URL}/api/${params.user_id}/tasks`,
    { headers: { Authorization: token || '' } }
  )
  return NextResponse.json(await response.json())
}
```

**Better Auth client:**
```typescript
import { createAuthClient } from "better-auth/client"
import { jwtClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_AUTH_URL,
  plugins: [jwtClient()]
})
```

---

## 4. User Data Isolation Pattern

### Decision
Enforce user isolation at the API layer via JWT verification + URL path matching + database query filtering.

### Rationale
- Defense in depth: multiple layers of protection
- JWT contains user_id as the subject claim
- URL path includes user_id for RESTful design
- All database queries filter by user_id

### Implementation Pattern

```python
@router.get("/api/{user_id}/tasks")
async def get_tasks(
    user_id: str,
    current_user: Dict = Depends(verify_jwt_token),
    session: Session = Depends(get_session)
):
    # Layer 1: JWT verification (automatic via dependency)

    # Layer 2: Path parameter matching
    if current_user["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    # Layer 3: Database query filtering
    tasks = session.exec(
        select(Task).where(Task.user_id == user_id)
    ).all()

    return {"success": True, "data": tasks}
```

---

## 5. Responsive UI with Tailwind CSS

### Decision
Use Tailwind CSS with mobile-first responsive design patterns.

### Rationale
- Utility-first approach enables rapid iteration
- Built-in responsive breakpoints (sm, md, lg, xl)
- Tree-shaking removes unused styles
- Consistent with Next.js ecosystem

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| CSS Modules | More verbose; requires separate files |
| Styled Components | Runtime overhead; less compatible with server components |
| Bootstrap | Heavier; opinionated design |

### Implementation Pattern

```tsx
// Mobile-first responsive component
function TaskList({ tasks }: { tasks: Task[] }) {
  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <ul className="divide-y divide-gray-200">
        {tasks.map(task => (
          <li key={task.id} className="py-4 flex items-center justify-between">
            <span className={task.completed ? "line-through text-gray-500" : ""}>
              {task.title}
            </span>
            <button className="px-3 py-1 text-sm bg-blue-500 text-white rounded
                             hover:bg-blue-600 focus:ring-2 focus:ring-blue-300">
              Toggle
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

---

## 6. Testing Strategy

### Decision
Use pytest + httpx for backend contract tests; Jest + React Testing Library for frontend component tests.

### Rationale
- pytest is the standard Python testing framework
- httpx provides async-compatible HTTP client for API testing
- Jest is the default for Next.js projects
- React Testing Library encourages testing user behavior over implementation

### Implementation Pattern

**Backend contract test:**
```python
import pytest
from httpx import AsyncClient
from main import app

@pytest.fixture
async def client():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

async def test_create_task(client, auth_headers):
    response = await client.post(
        "/api/user-123/tasks",
        json={"title": "Test task"},
        headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json()["data"]["title"] == "Test task"
```

**Frontend component test:**
```typescript
import { render, screen } from '@testing-library/react'
import { TaskList } from '@/components/TaskList'

test('renders task items', () => {
  const tasks = [{ id: 1, title: 'Test', completed: false }]
  render(<TaskList tasks={tasks} />)
  expect(screen.getByText('Test')).toBeInTheDocument()
})
```

---

## 7. Deployment Architecture

### Decision
Deploy Next.js to Vercel (free tier), FastAPI to Railway or Render (free tier), Neon PostgreSQL (free tier).

### Rationale
- Vercel is optimized for Next.js with zero configuration
- Railway/Render provide simple container deployments for Python
- Neon offers serverless PostgreSQL with generous free tier
- All platforms support environment variable configuration

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Single Vercel deployment | FastAPI requires Python runtime; Vercel serverless has cold start issues |
| Docker Compose on VM | More complex; not serverless; requires infrastructure management |
| AWS Lambda + API Gateway | Overkill for Phase II; higher complexity |

### Environment Variables

| Variable | Location | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Backend | Neon PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Frontend + Backend | JWT signing/verification secret |
| `BETTER_AUTH_URL` | Frontend | Better Auth server URL |
| `BACKEND_URL` | Frontend | FastAPI backend URL (private) |
| `NEXT_PUBLIC_APP_URL` | Frontend | Public app URL |

---

## 8. Error Handling Pattern

### Decision
Use standardized error response format across all API endpoints with proper HTTP status codes.

### Rationale
- Consistent error format simplifies frontend error handling
- Request ID enables log correlation for debugging
- HTTP status codes follow REST conventions

### Implementation Pattern

```python
from pydantic import BaseModel
from typing import Optional
import uuid

class ErrorResponse(BaseModel):
    detail: str
    status_code: int
    request_id: str
    code: Optional[str] = None

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            detail=exc.detail,
            status_code=exc.status_code,
            request_id=str(uuid.uuid4())
        ).model_dump()
    )
```

---

## Research Completion Checklist

- [x] Better Auth + JWT + FastAPI integration pattern
- [x] SQLModel + Neon PostgreSQL setup
- [x] Next.js App Router architecture
- [x] User data isolation enforcement
- [x] Responsive UI approach
- [x] Testing strategy and frameworks
- [x] Deployment architecture
- [x] Error handling pattern

All technical unknowns resolved. Ready for Phase 1 design.
