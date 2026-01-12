---
name: better-auth
description: "Better Auth JWT authentication skill for Todo Full-Stack application. Use when: (1) Configuring JWT token verification in FastAPI, (2) Setting up Better Auth client in Next.js, (3) Implementing signup and signin flows, (4) Creating protected routes and layouts, (5) Managing session state in React, (6) Handling token expiration and refresh, (7) Implementing signout functionality. Covers Better Auth, JWT tokens, protected routes, and session management."
---

# Better Auth Skill

Implement secure JWT-based authentication with Better Auth for Next.js frontend and FastAPI backend.

## Quick Reference

| Task | Pattern |
|------|---------|
| Backend auth dependency | `get_current_user = Depends(verify_token)` |
| Frontend auth client | `createAuthClient({ baseURL })` |
| Protected page | Check session in layout, redirect if null |
| Protected API route | `await auth()` returns session or null |
| Sign in | `authClient.signIn.email({ email, password })` |
| Sign out | `authClient.signOut()` |
| Get session (client) | `useSession()` hook |
| Get session (server) | `await auth()` in server component |

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Next.js Frontend                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Auth Pages │  │  Dashboard  │  │  API Routes         │  │
│  │  /signin    │  │  /tasks     │  │  /api/auth/[...all] │  │
│  │  /signup    │  │  (protected)│  │  /api/tasks (proxy) │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│         │                │                    │              │
│         └────────────────┼────────────────────┘              │
│                          │ JWT Token                         │
└──────────────────────────┼───────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     FastAPI Backend                          │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Auth Middleware: verify_token()                     │    │
│  │  - Extracts Bearer token from Authorization header   │    │
│  │  - Verifies JWT signature with shared secret         │    │
│  │  - Returns user payload { id, email, name }          │    │
│  └─────────────────────────────────────────────────────┘    │
│                          │                                   │
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Protected Routes: /api/tasks/*                      │    │
│  │  - Depends(get_current_user)                         │    │
│  │  - User ID from token for data isolation             │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Backend: FastAPI JWT Verification

### Configuration

```python
# src/config.py
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""

    # Better Auth JWT settings
    better_auth_secret: str  # Shared secret with Next.js
    jwt_algorithm: str = "HS256"

    class Config:
        env_file = ".env"


settings = Settings()
```

### Auth Middleware

```python
# src/auth.py
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from .config import settings

# Security scheme for Swagger UI
security = HTTPBearer()


class AuthUser:
    """Authenticated user from JWT token."""

    def __init__(self, id: str, email: str, name: str | None = None):
        self.id = id
        self.email = email
        self.name = name


async def verify_token(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
) -> AuthUser:
    """
    Verify JWT token and return authenticated user.

    Raises:
        HTTPException: If token is invalid or expired
    """
    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            settings.better_auth_secret,
            algorithms=[settings.jwt_algorithm],
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

    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token validation failed: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


# Dependency for protected routes
get_current_user = verify_token
```

### Protected Routes

```python
# src/routes/tasks.py
from typing import Annotated

from fastapi import APIRouter, Depends

from ..auth import AuthUser, get_current_user
from ..db import get_session

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("")
async def list_tasks(
    user: Annotated[AuthUser, Depends(get_current_user)],
    session: AsyncSession = Depends(get_session),
):
    """List all tasks for authenticated user."""
    # user.id is guaranteed to be valid here
    tasks = await task_service.get_tasks(session, user.id)
    return tasks


@router.post("")
async def create_task(
    task_in: TaskCreate,
    user: Annotated[AuthUser, Depends(get_current_user)],
    session: AsyncSession = Depends(get_session),
):
    """Create task for authenticated user."""
    task = await task_service.create_task(session, user.id, task_in)
    return task
```

## Frontend: Next.js Better Auth Setup

### Install Dependencies

```bash
npm install better-auth
```

### Auth Server Configuration

```typescript
// lib/auth-server.ts
import { betterAuth } from "better-auth";
import { Pool } from "@neondatabase/serverless";

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },
  secret: process.env.BETTER_AUTH_SECRET,
});
```

### Auth Client Setup

```typescript
// lib/auth-client.ts
"use client";

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});

// Export hooks and methods
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient;
```

### Auth API Route Handler

```typescript
// app/api/auth/[...all]/route.ts
import { auth } from "@/lib/auth-server";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
```

### Server-Side Session Helper

```typescript
// lib/auth.ts
import { auth } from "./auth-server";
import { headers } from "next/headers";

export async function getServerSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

// Type exports
export type Session = Awaited<ReturnType<typeof getServerSession>>;
export type User = NonNullable<Session>["user"];
```

## Protected Routes and Layouts

### Protected Layout (Server Component)

```typescript
// app/(dashboard)/layout.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session) {
    redirect("/signin");
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar user={session.user} />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
```

### Protected Page (Server Component)

```typescript
// app/(dashboard)/tasks/page.tsx
import { getServerSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TaskList } from "@/components/task-list";

export default async function TasksPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/signin");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Your Tasks</h1>
      <TaskList userId={session.user.id} />
    </div>
  );
}
```

### Protected Client Component

```typescript
"use client";

import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function ProtectedContent({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/signin");
    }
  }, [session, isPending, router]);

  if (isPending) {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return <>{children}</>;
}
```

## Authentication Flows

### Sign In Form

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    try {
      const result = await signIn.email({
        email,
        password,
      });

      if (result.error) {
        setError(result.error.message || "Sign in failed");
        return;
      }

      router.push("/tasks");
      router.refresh();
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isPending}
        />
      </div>
      <div>
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          disabled={isPending}
        />
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Signing in..." : "Sign In"}
      </Button>
    </form>
  );
}
```

### Sign Up Form

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signUp } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SignUpForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    try {
      const result = await signUp.email({
        name,
        email,
        password,
      });

      if (result.error) {
        setError(result.error.message || "Sign up failed");
        return;
      }

      // Auto sign in after signup
      router.push("/tasks");
      router.refresh();
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={isPending}
        />
      </div>
      <div>
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isPending}
        />
      </div>
      <div>
        <Input
          type="password"
          placeholder="Password (min 8 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          disabled={isPending}
        />
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Creating account..." : "Sign Up"}
      </Button>
    </form>
  );
}
```

### Sign Out Button

```typescript
"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <Button variant="ghost" onClick={handleSignOut}>
      Sign Out
    </Button>
  );
}
```

## API Route Proxy with Auth

```typescript
// app/api/tasks/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";

const API_URL = process.env.API_URL!;

export async function GET(request: NextRequest) {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const response = await fetch(`${API_URL}/tasks`, {
    headers: {
      Authorization: `Bearer ${session.session.token}`,
    },
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = await request.json();

  const response = await fetch(`${API_URL}/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.session.token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
```

## Environment Variables

### Frontend (.env.local)

```bash
# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Better Auth
BETTER_AUTH_SECRET=your-secret-key-min-32-chars

# Database (for Better Auth tables)
DATABASE_URL=postgresql://user:pass@host/db

# Backend API
API_URL=http://localhost:8000/api
```

### Backend (.env)

```bash
# Better Auth (shared secret)
BETTER_AUTH_SECRET=your-secret-key-min-32-chars

# JWT
JWT_ALGORITHM=HS256
```

## Dependencies

### Frontend (package.json)

```json
{
  "dependencies": {
    "better-auth": "^1.0.0",
    "@neondatabase/serverless": "^0.10.0"
  }
}
```

### Backend (pyproject.toml)

```toml
[project]
dependencies = [
    "python-jose[cryptography]>=3.3.0",
]
```

## References

- **[backend.md](references/backend.md)**: Advanced FastAPI patterns, middleware, testing auth
- **[frontend.md](references/frontend.md)**: React patterns, hooks, session caching
- **[flows.md](references/flows.md)**: Complete auth flows, error handling, edge cases
