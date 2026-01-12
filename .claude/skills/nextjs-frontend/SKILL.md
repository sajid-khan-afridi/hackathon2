---
name: nextjs-frontend
description: "Next.js 16+ frontend development skill for Todo Full-Stack application. Use when: (1) Creating App Router pages and layouts, (2) Building React components with TypeScript, (3) Implementing Tailwind CSS responsive styling, (4) Creating API route proxies to backend, (5) Managing authentication state with Better Auth, (6) Building forms with validation, (7) Implementing loading and error states, (8) Writing Jest and React Testing Library tests. Covers Next.js App Router, TypeScript, Tailwind CSS, and React patterns."
---

# Next.js Frontend Skill

Build production-ready Next.js 16+ applications with App Router, TypeScript, and Tailwind CSS.

## Quick Reference

| Task | Pattern |
|------|---------|
| New page | `app/<route>/page.tsx` with metadata export |
| Layout | `app/<route>/layout.tsx` wrapping children |
| Loading state | `app/<route>/loading.tsx` with skeleton |
| Error boundary | `app/<route>/error.tsx` with 'use client' |
| API proxy | `app/api/<route>/route.ts` with NextRequest |
| Server action | `'use server'` in async function |
| Client component | `'use client'` at file top |

## Project Structure

```
app/
├── layout.tsx          # Root layout with providers
├── page.tsx            # Home page
├── loading.tsx         # Global loading
├── error.tsx           # Global error boundary
├── globals.css         # Tailwind imports
├── (auth)/             # Auth route group
│   ├── login/page.tsx
│   └── register/page.tsx
├── dashboard/
│   ├── layout.tsx      # Dashboard layout
│   ├── page.tsx
│   └── loading.tsx
├── api/
│   ├── auth/[...all]/route.ts  # Better Auth handler
│   └── todos/route.ts          # API proxy
components/
├── ui/                 # Reusable UI components
├── forms/              # Form components
└── layout/             # Layout components
lib/
├── auth.ts             # Better Auth client
├── api.ts              # API client
└── utils.ts            # Utilities
```

## Pages and Layouts

### Page with Metadata

```tsx
// app/dashboard/page.tsx
import { Metadata } from 'next'
import { TodoList } from '@/components/todo-list'

export const metadata: Metadata = {
  title: 'Dashboard | Todo App',
  description: 'Manage your tasks',
}

export default async function DashboardPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Your Tasks</h1>
      <TodoList />
    </main>
  )
}
```

### Layout with Auth

```tsx
// app/dashboard/layout.tsx
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { Sidebar } from '@/components/layout/sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="flex min-h-screen">
      <Sidebar user={session.user} />
      <div className="flex-1">{children}</div>
    </div>
  )
}
```

## Components

### Server Component (default)

```tsx
// components/todo-list.tsx
import { getTodos } from '@/lib/api'
import { TodoItem } from './todo-item'

export async function TodoList() {
  const todos = await getTodos()

  if (todos.length === 0) {
    return <p className="text-muted-foreground">No tasks yet</p>
  }

  return (
    <ul className="space-y-2">
      {todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </ul>
  )
}
```

### Client Component with State

```tsx
'use client'

import { useState } from 'react'
import { Todo } from '@/lib/types'
import { toggleTodo } from '@/lib/actions'

interface TodoItemProps {
  todo: Todo
}

export function TodoItem({ todo }: TodoItemProps) {
  const [isPending, setIsPending] = useState(false)

  async function handleToggle() {
    setIsPending(true)
    await toggleTodo(todo.id)
    setIsPending(false)
  }

  return (
    <li className="flex items-center gap-3 p-3 rounded-lg border">
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={handleToggle}
        disabled={isPending}
        className="h-4 w-4 rounded border-gray-300"
      />
      <span className={todo.completed ? 'line-through text-muted-foreground' : ''}>
        {todo.title}
      </span>
    </li>
  )
}
```

## Forms with Validation

### Form Component

```tsx
'use client'

import { useActionState } from 'react'
import { createTodo } from '@/lib/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function CreateTodoForm() {
  const [state, action, isPending] = useActionState(createTodo, null)

  return (
    <form action={action} className="flex gap-2">
      <Input
        name="title"
        placeholder="What needs to be done?"
        required
        minLength={1}
        maxLength={200}
        aria-describedby={state?.error ? 'title-error' : undefined}
      />
      <Button type="submit" disabled={isPending}>
        {isPending ? 'Adding...' : 'Add'}
      </Button>
      {state?.error && (
        <p id="title-error" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
    </form>
  )
}
```

### Server Action with Validation

```tsx
// lib/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const todoSchema = z.object({
  title: z.string().min(1, 'Title required').max(200, 'Title too long'),
})

export async function createTodo(prevState: unknown, formData: FormData) {
  const parsed = todoSchema.safeParse({
    title: formData.get('title'),
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const res = await fetch(`${process.env.API_URL}/todos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(parsed.data),
  })

  if (!res.ok) {
    return { error: 'Failed to create task' }
  }

  revalidatePath('/dashboard')
  return { success: true }
}
```

## API Route Proxies

```tsx
// app/api/todos/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

const API_URL = process.env.API_URL!

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const res = await fetch(`${API_URL}/todos`, {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
    },
  })

  const data = await res.json()
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  const res = await fetch(`${API_URL}/todos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.accessToken}`,
    },
    body: JSON.stringify(body),
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
```

## Loading and Error States

### Loading Skeleton

```tsx
// app/dashboard/loading.tsx
import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="h-8 w-48 mb-6" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    </div>
  )
}
```

### Error Boundary

```tsx
'use client'

// app/dashboard/error.tsx
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <div className="container mx-auto px-4 py-8 text-center">
      <h2 className="text-xl font-semibold mb-4">Something went wrong</h2>
      <p className="text-muted-foreground mb-4">
        {error.message || 'Failed to load dashboard'}
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  )
}
```

## Better Auth Integration

### Auth Client Setup

```tsx
// lib/auth.ts
import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
})

export const { signIn, signOut, useSession } = authClient
```

### Auth API Route

```tsx
// app/api/auth/[...all]/route.ts
import { auth } from '@/lib/auth-server'
import { toNextJsHandler } from 'better-auth/next-js'

export const { GET, POST } = toNextJsHandler(auth)
```

### Protected Client Component

```tsx
'use client'

import { useSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export function ProtectedContent({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession()

  if (isPending) return <div>Loading...</div>
  if (!session) redirect('/login')

  return <>{children}</>
}
```

## Tailwind CSS Patterns

### Responsive Layout

```tsx
<div className="
  grid
  grid-cols-1
  md:grid-cols-2
  lg:grid-cols-3
  gap-4
">
  {items.map(item => <Card key={item.id} {...item} />)}
</div>
```

### Dark Mode Support

```tsx
<div className="
  bg-white dark:bg-gray-900
  text-gray-900 dark:text-gray-100
  border border-gray-200 dark:border-gray-700
">
  Content
</div>
```

### Common Utilities

```tsx
// Container with padding
<div className="container mx-auto px-4 py-8">

// Card with shadow
<div className="rounded-lg border bg-card p-6 shadow-sm">

// Flex center
<div className="flex items-center justify-center min-h-screen">

// Text styles
<h1 className="text-2xl font-bold tracking-tight">
<p className="text-sm text-muted-foreground">
```

## Testing

### Component Test

```tsx
// __tests__/components/todo-item.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { TodoItem } from '@/components/todo-item'

const mockTodo = {
  id: '1',
  title: 'Test task',
  completed: false,
}

describe('TodoItem', () => {
  it('renders todo title', () => {
    render(<TodoItem todo={mockTodo} />)
    expect(screen.getByText('Test task')).toBeInTheDocument()
  })

  it('shows checkbox unchecked for incomplete todo', () => {
    render(<TodoItem todo={mockTodo} />)
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).not.toBeChecked()
  })

  it('applies strikethrough for completed todo', () => {
    render(<TodoItem todo={{ ...mockTodo, completed: true }} />)
    expect(screen.getByText('Test task')).toHaveClass('line-through')
  })
})
```

### API Route Test

```tsx
// __tests__/api/todos.test.ts
import { GET, POST } from '@/app/api/todos/route'
import { NextRequest } from 'next/server'

jest.mock('@/lib/auth', () => ({
  auth: jest.fn().mockResolvedValue({ user: { id: '1' } }),
}))

describe('GET /api/todos', () => {
  it('returns todos for authenticated user', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ id: '1', title: 'Test' }]),
    })

    const request = new NextRequest('http://localhost/api/todos')
    const response = await GET(request)
    const data = await response.json()

    expect(data).toHaveLength(1)
    expect(data[0].title).toBe('Test')
  })
})
```

## References

- **[patterns.md](references/patterns.md)**: Advanced patterns (optimistic updates, infinite scroll, real-time)
- **[testing.md](references/testing.md)**: Comprehensive testing guide with mocking strategies
