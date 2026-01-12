# Authentication Flows

Complete authentication flow patterns and edge case handling.

## Sign Up Flow

### Complete Sign Up Implementation

```typescript
// components/auth/signup-form.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signUp } from "@/lib/auth-client";
import { z } from "zod";

const signUpSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[0-9]/, "Password must contain a number"),
});

type SignUpData = z.infer<typeof signUpSchema>;

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  form?: string;
}

export function SignUpForm() {
  const router = useRouter();
  const [data, setData] = useState<SignUpData>({
    name: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isPending, setIsPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function validateField(field: keyof SignUpData, value: string) {
    try {
      signUpSchema.shape[field].parse(value);
      setErrors((e) => ({ ...e, [field]: undefined }));
    } catch (err) {
      if (err instanceof z.ZodError) {
        setErrors((e) => ({ ...e, [field]: err.errors[0].message }));
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    // Validate all fields
    const result = signUpSchema.safeParse(data);
    if (!result.success) {
      const fieldErrors: FormErrors = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof FormErrors;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsPending(true);

    try {
      const response = await signUp.email({
        name: data.name,
        email: data.email,
        password: data.password,
      });

      if (response.error) {
        setErrors({ form: mapSignUpError(response.error) });
        return;
      }

      // Success - redirect to tasks
      router.push("/tasks");
      router.refresh();
    } catch (err) {
      setErrors({ form: "An unexpected error occurred. Please try again." });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.form && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
          {errors.form}
        </div>
      )}

      {/* Name Field */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          Name
        </label>
        <input
          id="name"
          type="text"
          value={data.name}
          onChange={(e) => {
            setData((d) => ({ ...d, name: e.target.value }));
            validateField("name", e.target.value);
          }}
          onBlur={(e) => validateField("name", e.target.value)}
          required
          disabled={isPending}
          className={`w-full px-3 py-2 border rounded-md ${
            errors.name ? "border-destructive" : ""
          }`}
          autoComplete="name"
        />
        {errors.name && (
          <p className="text-sm text-destructive mt-1">{errors.name}</p>
        )}
      </div>

      {/* Email Field */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={data.email}
          onChange={(e) => {
            setData((d) => ({ ...d, email: e.target.value }));
            validateField("email", e.target.value);
          }}
          onBlur={(e) => validateField("email", e.target.value)}
          required
          disabled={isPending}
          className={`w-full px-3 py-2 border rounded-md ${
            errors.email ? "border-destructive" : ""
          }`}
          autoComplete="email"
        />
        {errors.email && (
          <p className="text-sm text-destructive mt-1">{errors.email}</p>
        )}
      </div>

      {/* Password Field */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={data.password}
            onChange={(e) => {
              setData((d) => ({ ...d, password: e.target.value }));
              validateField("password", e.target.value);
            }}
            onBlur={(e) => validateField("password", e.target.value)}
            required
            disabled={isPending}
            className={`w-full px-3 py-2 border rounded-md pr-10 ${
              errors.password ? "border-destructive" : ""
            }`}
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        {errors.password && (
          <p className="text-sm text-destructive mt-1">{errors.password}</p>
        )}
        <PasswordStrength password={data.password} />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md disabled:opacity-50"
      >
        {isPending ? "Creating account..." : "Create Account"}
      </button>
    </form>
  );
}

function mapSignUpError(error: { code?: string; message?: string }): string {
  switch (error.code) {
    case "USER_ALREADY_EXISTS":
      return "An account with this email already exists";
    case "INVALID_EMAIL":
      return "Please enter a valid email address";
    case "WEAK_PASSWORD":
      return "Password does not meet requirements";
    default:
      return error.message || "Failed to create account";
  }
}

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8+ characters", met: password.length >= 8 },
    { label: "Uppercase", met: /[A-Z]/.test(password) },
    { label: "Lowercase", met: /[a-z]/.test(password) },
    { label: "Number", met: /[0-9]/.test(password) },
  ];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1">
      {checks.map((check) => (
        <div
          key={check.label}
          className={`text-xs flex items-center gap-1 ${
            check.met ? "text-green-600" : "text-muted-foreground"
          }`}
        >
          {check.met ? "✓" : "○"} {check.label}
        </div>
      ))}
    </div>
  );
}
```

## Sign In Flow

### With Remember Me and Redirect

```typescript
// components/auth/signin-form.tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/lib/auth-client";

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/tasks";
  const sessionExpired = searchParams.get("expired") === "true";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(
    sessionExpired ? "Your session has expired. Please sign in again." : null
  );
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    try {
      const result = await signIn.email({
        email,
        password,
        rememberMe, // Extends session duration
      });

      if (result.error) {
        setError(mapSignInError(result.error));
        return;
      }

      // Clear sensitive data
      setPassword("");

      // Redirect to original destination or default
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isPending}
            className="w-full px-3 py-2 border rounded-md"
            autoComplete="email"
            autoFocus
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isPending}
            className="w-full px-3 py-2 border rounded-md"
            autoComplete="current-password"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="remember"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            disabled={isPending}
            className="rounded border-gray-300"
          />
          <label htmlFor="remember" className="text-sm text-muted-foreground">
            Remember me for 30 days
          </label>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md disabled:opacity-50"
        >
          {isPending ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Don't have an account?{" "}
        <Link href="/signup" className="text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}

function mapSignInError(error: { code?: string; message?: string }): string {
  switch (error.code) {
    case "INVALID_CREDENTIALS":
      return "Invalid email or password";
    case "USER_NOT_FOUND":
      return "No account found with this email";
    case "ACCOUNT_LOCKED":
      return "Account locked. Please try again later.";
    case "EMAIL_NOT_VERIFIED":
      return "Please verify your email before signing in";
    default:
      return error.message || "Sign in failed";
  }
}
```

## Sign Out Flow

### Complete Sign Out with Cleanup

```typescript
// components/auth/signout-button.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";

interface SignOutButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export function SignOutButton({ className, children }: SignOutButtonProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleSignOut() {
    setIsPending(true);

    try {
      await signOut();

      // Clear any client-side state/cache
      if (typeof window !== "undefined") {
        // Clear localStorage items related to app
        localStorage.removeItem("tasks-draft");
        localStorage.removeItem("user-preferences");
      }

      // Hard redirect to clear all state
      window.location.href = "/";
    } catch (err) {
      console.error("Sign out error:", err);
      // Still redirect even on error
      window.location.href = "/";
    }
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={isPending}
      className={className}
    >
      {isPending ? "Signing out..." : children || "Sign Out"}
    </button>
  );
}
```

### Sign Out from Server Action

```typescript
// app/actions/auth.ts
"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth-server";
import { headers } from "next/headers";

export async function signOutAction() {
  await auth.api.signOut({
    headers: await headers(),
  });

  redirect("/");
}
```

## Session Expiration Handling

### Auto-Redirect on Session Expiry

```typescript
// providers/session-monitor.tsx
"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "@/lib/auth-client";

const PROTECTED_PATHS = ["/tasks", "/settings", "/profile"];

export function SessionMonitor({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const wasAuthenticated = useRef(false);

  useEffect(() => {
    // Track if user was previously authenticated
    if (session) {
      wasAuthenticated.current = true;
    }
  }, [session]);

  useEffect(() => {
    // Only check after initial load
    if (isPending) return;

    // Check if session expired
    const isProtectedPath = PROTECTED_PATHS.some((p) => pathname.startsWith(p));

    if (!session && wasAuthenticated.current && isProtectedPath) {
      // Session expired while on protected page
      router.push(`/signin?redirect=${encodeURIComponent(pathname)}&expired=true`);
    }
  }, [session, isPending, pathname, router]);

  return <>{children}</>;
}
```

### Refresh Token on Activity

```typescript
// hooks/use-session-refresh.ts
"use client";

import { useEffect, useCallback } from "react";
import { getSession } from "@/lib/auth-client";

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
const ACTIVITY_EVENTS = ["mousedown", "keydown", "touchstart", "scroll"];

export function useSessionRefresh() {
  const refreshSession = useCallback(async () => {
    try {
      // Getting session refreshes it if needed
      await getSession();
    } catch (err) {
      console.error("Session refresh failed:", err);
    }
  }, []);

  useEffect(() => {
    let lastActivity = Date.now();
    let intervalId: NodeJS.Timeout;

    const handleActivity = () => {
      lastActivity = Date.now();
    };

    const checkAndRefresh = async () => {
      // Only refresh if user was active recently
      if (Date.now() - lastActivity < REFRESH_INTERVAL) {
        await refreshSession();
      }
    };

    // Add activity listeners
    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Set up periodic refresh
    intervalId = setInterval(checkAndRefresh, REFRESH_INTERVAL);

    return () => {
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      clearInterval(intervalId);
    };
  }, [refreshSession]);
}
```

## Error Handling

### Centralized Auth Error Handler

```typescript
// lib/auth-errors.ts

export enum AuthErrorCode {
  // Sign in errors
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  USER_NOT_FOUND = "USER_NOT_FOUND",
  ACCOUNT_LOCKED = "ACCOUNT_LOCKED",
  EMAIL_NOT_VERIFIED = "EMAIL_NOT_VERIFIED",

  // Sign up errors
  USER_ALREADY_EXISTS = "USER_ALREADY_EXISTS",
  INVALID_EMAIL = "INVALID_EMAIL",
  WEAK_PASSWORD = "WEAK_PASSWORD",

  // Session errors
  SESSION_EXPIRED = "SESSION_EXPIRED",
  INVALID_TOKEN = "INVALID_TOKEN",

  // General
  RATE_LIMITED = "RATE_LIMITED",
  NETWORK_ERROR = "NETWORK_ERROR",
  UNKNOWN = "UNKNOWN",
}

const ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  [AuthErrorCode.INVALID_CREDENTIALS]: "Invalid email or password",
  [AuthErrorCode.USER_NOT_FOUND]: "No account found with this email",
  [AuthErrorCode.ACCOUNT_LOCKED]: "Account locked. Please contact support.",
  [AuthErrorCode.EMAIL_NOT_VERIFIED]: "Please verify your email first",
  [AuthErrorCode.USER_ALREADY_EXISTS]: "An account with this email exists",
  [AuthErrorCode.INVALID_EMAIL]: "Please enter a valid email",
  [AuthErrorCode.WEAK_PASSWORD]: "Password does not meet requirements",
  [AuthErrorCode.SESSION_EXPIRED]: "Session expired. Please sign in again.",
  [AuthErrorCode.INVALID_TOKEN]: "Invalid session. Please sign in again.",
  [AuthErrorCode.RATE_LIMITED]: "Too many attempts. Please wait.",
  [AuthErrorCode.NETWORK_ERROR]: "Network error. Check your connection.",
  [AuthErrorCode.UNKNOWN]: "An error occurred. Please try again.",
};

export function getAuthErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null) {
    const code = (error as { code?: string }).code as AuthErrorCode;
    if (code && code in ERROR_MESSAGES) {
      return ERROR_MESSAGES[code];
    }
    const message = (error as { message?: string }).message;
    if (message) {
      return message;
    }
  }
  return ERROR_MESSAGES[AuthErrorCode.UNKNOWN];
}
```

## Page Components

### Sign In Page

```typescript
// app/(auth)/signin/page.tsx
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import { SignInForm } from "@/components/auth/signin-form";

export const metadata: Metadata = {
  title: "Sign In | Todo App",
};

export default async function SignInPage() {
  const session = await getServerSession();

  if (session) {
    redirect("/tasks");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">
          Sign in to your account
        </h1>
        <SignInForm />
      </div>
    </div>
  );
}
```

### Sign Up Page

```typescript
// app/(auth)/signup/page.tsx
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import { SignUpForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Sign Up | Todo App",
};

export default async function SignUpPage() {
  const session = await getServerSession();

  if (session) {
    redirect("/tasks");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">
          Create your account
        </h1>
        <SignUpForm />
      </div>
    </div>
  );
}
```
