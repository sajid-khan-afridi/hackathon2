# Frontend Authentication Patterns

Advanced Next.js patterns for Better Auth integration.

## Auth Client Configuration

### Full Client Setup

```typescript
// lib/auth-client.ts
"use client";

import { createAuthClient } from "better-auth/react";

const baseURL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const authClient = createAuthClient({
  baseURL,
  fetchOptions: {
    // Include credentials for cookie-based sessions
    credentials: "include",
  },
});

// Destructure commonly used exports
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient;

// Type exports
export type AuthClient = typeof authClient;
```

### Server-Side Auth Helper

```typescript
// lib/auth.ts
import { headers } from "next/headers";
import { auth } from "./auth-server";

/**
 * Get session in server components/actions.
 * Returns null if not authenticated.
 */
export async function getServerSession() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    return session;
  } catch {
    return null;
  }
}

/**
 * Require session - throws redirect if not authenticated.
 * Use in server components that must be protected.
 */
export async function requireSession() {
  const session = await getServerSession();
  if (!session) {
    const { redirect } = await import("next/navigation");
    redirect("/signin");
  }
  return session;
}

// Type exports
export type Session = NonNullable<Awaited<ReturnType<typeof getServerSession>>>;
export type User = Session["user"];
```

## Session Hook Patterns

### Basic Session Usage

```typescript
"use client";

import { useSession } from "@/lib/auth-client";

export function UserGreeting() {
  const { data: session, isPending, error } = useSession();

  if (isPending) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error loading session</div>;
  }

  if (!session) {
    return <div>Not signed in</div>;
  }

  return <div>Hello, {session.user.name}!</div>;
}
```

### Session with Redirect

```typescript
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";

export function useRequireAuth(redirectTo = "/signin") {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session) {
      router.push(redirectTo);
    }
  }, [session, isPending, router, redirectTo]);

  return { session, isPending, isAuthenticated: !!session };
}

// Usage
export function ProtectedPage() {
  const { session, isPending, isAuthenticated } = useRequireAuth();

  if (isPending || !isAuthenticated) {
    return <LoadingSpinner />;
  }

  return <div>Protected content for {session!.user.email}</div>;
}
```

### Redirect Authenticated Users

```typescript
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";

export function useRedirectIfAuthenticated(redirectTo = "/tasks") {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && session) {
      router.push(redirectTo);
    }
  }, [session, isPending, router, redirectTo]);

  return { session, isPending };
}

// Use on login/signup pages
export function SignInPage() {
  const { isPending } = useRedirectIfAuthenticated();

  if (isPending) {
    return <LoadingSpinner />;
  }

  return <SignInForm />;
}
```

## Auth Context Provider

### Global Auth State

```typescript
// providers/auth-provider.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useSession, signOut as authSignOut } from "@/lib/auth-client";
import type { User } from "@/lib/auth";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await authSignOut();
      window.location.href = "/"; // Hard redirect to clear state
    } finally {
      setIsSigningOut(false);
    }
  };

  const value: AuthContextType = {
    user: session?.user ?? null,
    isLoading: isPending || isSigningOut,
    isAuthenticated: !!session,
    signOut: handleSignOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
```

### Root Layout Integration

```typescript
// app/layout.tsx
import { AuthProvider } from "@/providers/auth-provider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

## Protected Route Patterns

### Server Component Protection

```typescript
// app/(dashboard)/layout.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session) {
    redirect("/signin?redirect=/tasks");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between">
          <h1 className="font-bold">Todo App</h1>
          <UserMenu user={session.user} />
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
```

### Client Component Protection (HOC)

```typescript
"use client";

import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { ComponentType, useEffect } from "react";

export function withAuth<P extends object>(
  Component: ComponentType<P>,
  redirectTo = "/signin"
) {
  return function ProtectedComponent(props: P) {
    const { data: session, isPending } = useSession();
    const router = useRouter();

    useEffect(() => {
      if (!isPending && !session) {
        router.push(redirectTo);
      }
    }, [session, isPending, router]);

    if (isPending) {
      return <div>Loading...</div>;
    }

    if (!session) {
      return null;
    }

    return <Component {...props} />;
  };
}

// Usage
const ProtectedTaskList = withAuth(TaskList);
```

## Form Handling

### Sign In with Error Handling

```typescript
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "@/lib/auth-client";

interface FormState {
  email: string;
  password: string;
  error: string | null;
  isPending: boolean;
}

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/tasks";

  const [state, setState] = useState<FormState>({
    email: "",
    password: "",
    error: null,
    isPending: false,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState((s) => ({ ...s, error: null, isPending: true }));

    try {
      const result = await signIn.email({
        email: state.email,
        password: state.password,
      });

      if (result.error) {
        setState((s) => ({
          ...s,
          error: getErrorMessage(result.error),
          isPending: false,
        }));
        return;
      }

      // Success - redirect
      router.push(redirectTo);
      router.refresh(); // Refresh server components
    } catch (err) {
      setState((s) => ({
        ...s,
        error: "An unexpected error occurred. Please try again.",
        isPending: false,
      }));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {state.error && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
          {state.error}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={state.email}
          onChange={(e) => setState((s) => ({ ...s, email: e.target.value }))}
          required
          disabled={state.isPending}
          className="w-full px-3 py-2 border rounded-md"
          autoComplete="email"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={state.password}
          onChange={(e) => setState((s) => ({ ...s, password: e.target.value }))}
          required
          minLength={8}
          disabled={state.isPending}
          className="w-full px-3 py-2 border rounded-md"
          autoComplete="current-password"
        />
      </div>

      <button
        type="submit"
        disabled={state.isPending}
        className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md disabled:opacity-50"
      >
        {state.isPending ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}

function getErrorMessage(error: { code?: string; message?: string }): string {
  switch (error.code) {
    case "INVALID_CREDENTIALS":
      return "Invalid email or password";
    case "USER_NOT_FOUND":
      return "No account found with this email";
    case "TOO_MANY_ATTEMPTS":
      return "Too many attempts. Please try again later.";
    default:
      return error.message || "Sign in failed";
  }
}
```

## API Client with Auth

### Fetch Wrapper

```typescript
// lib/api.ts
import { getSession } from "@/lib/auth-client";

const API_BASE = "/api";

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function fetchWithAuth<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const session = await getSession();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // Add auth header if we have a session
  if (session?.session?.token) {
    (headers as Record<string, string>)["Authorization"] =
      `Bearer ${session.session.token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ApiError(
      error.message || "Request failed",
      response.status,
      error.code
    );
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// API methods
export const api = {
  tasks: {
    list: () => fetchWithAuth<Task[]>("/tasks"),
    get: (id: number) => fetchWithAuth<Task>(`/tasks/${id}`),
    create: (data: TaskCreate) =>
      fetchWithAuth<Task>("/tasks", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: number, data: TaskUpdate) =>
      fetchWithAuth<Task>(`/tasks/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    toggle: (id: number) =>
      fetchWithAuth<Task>(`/tasks/${id}/toggle`, {
        method: "POST",
      }),
    delete: (id: number) =>
      fetchWithAuth<void>(`/tasks/${id}`, {
        method: "DELETE",
      }),
  },
};
```

## Testing

### Mock Auth in Tests

```typescript
// __tests__/components/task-list.test.tsx
import { render, screen } from "@testing-library/react";
import { TaskList } from "@/components/task-list";

// Mock the auth client
jest.mock("@/lib/auth-client", () => ({
  useSession: jest.fn(() => ({
    data: {
      user: { id: "test-123", email: "test@example.com", name: "Test" },
      session: { token: "mock-token" },
    },
    isPending: false,
  })),
  getSession: jest.fn(() =>
    Promise.resolve({
      user: { id: "test-123", email: "test@example.com", name: "Test" },
      session: { token: "mock-token" },
    })
  ),
}));

describe("TaskList", () => {
  it("renders tasks for authenticated user", async () => {
    render(<TaskList />);
    // ... assertions
  });
});
```

### Test Unauthenticated State

```typescript
import { useSession } from "@/lib/auth-client";

jest.mock("@/lib/auth-client");

describe("Protected Component", () => {
  it("redirects when not authenticated", () => {
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      isPending: false,
    });

    // ... test redirect behavior
  });

  it("shows loading state while checking auth", () => {
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      isPending: true,
    });

    render(<ProtectedComponent />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });
});
```
