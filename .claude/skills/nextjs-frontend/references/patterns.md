# Advanced Next.js Patterns

## Optimistic Updates

Update UI immediately, rollback on failure:

```tsx
'use client'

import { useOptimistic, useTransition } from 'react'
import { toggleTodo } from '@/lib/actions'

export function TodoItem({ todo }: { todo: Todo }) {
  const [isPending, startTransition] = useTransition()
  const [optimisticTodo, setOptimisticTodo] = useOptimistic(
    todo,
    (state, completed: boolean) => ({ ...state, completed })
  )

  function handleToggle() {
    startTransition(async () => {
      setOptimisticTodo(!optimisticTodo.completed)
      await toggleTodo(todo.id)
    })
  }

  return (
    <li className={isPending ? 'opacity-50' : ''}>
      <input
        type="checkbox"
        checked={optimisticTodo.completed}
        onChange={handleToggle}
      />
      {todo.title}
    </li>
  )
}
```

## Infinite Scroll

Load more items as user scrolls:

```tsx
'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { getTodos } from '@/lib/api'

export function InfiniteTodoList({ initialTodos }: { initialTodos: Todo[] }) {
  const [todos, setTodos] = useState(initialTodos)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const observerRef = useRef<IntersectionObserver>()

  const lastItemRef = useCallback((node: HTMLLIElement) => {
    if (loading) return
    if (observerRef.current) observerRef.current.disconnect()

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore()
      }
    })

    if (node) observerRef.current.observe(node)
  }, [loading, hasMore])

  async function loadMore() {
    setLoading(true)
    const nextPage = page + 1
    const newTodos = await getTodos({ page: nextPage })

    if (newTodos.length === 0) {
      setHasMore(false)
    } else {
      setTodos(prev => [...prev, ...newTodos])
      setPage(nextPage)
    }
    setLoading(false)
  }

  return (
    <ul>
      {todos.map((todo, i) => (
        <li
          key={todo.id}
          ref={i === todos.length - 1 ? lastItemRef : undefined}
        >
          {todo.title}
        </li>
      ))}
      {loading && <li>Loading more...</li>}
    </ul>
  )
}
```

## Real-time Updates with Server-Sent Events

```tsx
'use client'

import { useEffect, useState } from 'react'

export function RealtimeTodos({ initialTodos }: { initialTodos: Todo[] }) {
  const [todos, setTodos] = useState(initialTodos)

  useEffect(() => {
    const eventSource = new EventSource('/api/todos/stream')

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)

      switch (data.type) {
        case 'created':
          setTodos(prev => [...prev, data.todo])
          break
        case 'updated':
          setTodos(prev =>
            prev.map(t => t.id === data.todo.id ? data.todo : t)
          )
          break
        case 'deleted':
          setTodos(prev => prev.filter(t => t.id !== data.todoId))
          break
      }
    }

    return () => eventSource.close()
  }, [])

  return (
    <ul>
      {todos.map(todo => (
        <li key={todo.id}>{todo.title}</li>
      ))}
    </ul>
  )
}
```

SSE API Route:

```tsx
// app/api/todos/stream/route.ts
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      // Subscribe to todo changes (e.g., from Redis pub/sub)
      const subscription = await subscribeToTodoChanges((event) => {
        const data = `data: ${JSON.stringify(event)}\n\n`
        controller.enqueue(encoder.encode(data))
      })

      request.signal.addEventListener('abort', () => {
        subscription.unsubscribe()
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
```

## Parallel Data Fetching

Fetch multiple resources simultaneously:

```tsx
// app/dashboard/page.tsx
import { Suspense } from 'react'
import { TodoList } from '@/components/todo-list'
import { Stats } from '@/components/stats'
import { RecentActivity } from '@/components/recent-activity'

export default function DashboardPage() {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="col-span-2">
        <Suspense fallback={<TodoListSkeleton />}>
          <TodoList />
        </Suspense>
      </div>
      <div className="space-y-4">
        <Suspense fallback={<StatsSkeleton />}>
          <Stats />
        </Suspense>
        <Suspense fallback={<ActivitySkeleton />}>
          <RecentActivity />
        </Suspense>
      </div>
    </div>
  )
}
```

## URL State Management

Sync filters with URL for shareable state:

```tsx
'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useCallback } from 'react'

type Filter = 'all' | 'active' | 'completed'

export function TodoFilter() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const filter = (searchParams.get('filter') as Filter) || 'all'

  const setFilter = useCallback((newFilter: Filter) => {
    const params = new URLSearchParams(searchParams)
    if (newFilter === 'all') {
      params.delete('filter')
    } else {
      params.set('filter', newFilter)
    }
    router.push(`${pathname}?${params.toString()}`)
  }, [searchParams, router, pathname])

  return (
    <div className="flex gap-2">
      {(['all', 'active', 'completed'] as const).map(f => (
        <button
          key={f}
          onClick={() => setFilter(f)}
          className={filter === f ? 'font-bold' : ''}
        >
          {f}
        </button>
      ))}
    </div>
  )
}
```

## Debounced Search

```tsx
'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export function SearchInput() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [query, setQuery] = useState(searchParams.get('q') || '')

  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        const params = new URLSearchParams(searchParams)
        if (query) {
          params.set('q', query)
        } else {
          params.delete('q')
        }
        router.push(`?${params.toString()}`)
      })
    }, 300)

    return () => clearTimeout(timer)
  }, [query, router, searchParams])

  return (
    <input
      type="search"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Search todos..."
      className={isPending ? 'opacity-50' : ''}
    />
  )
}
```

## Modal with Parallel Route

```
app/
├── @modal/
│   ├── default.tsx        # Returns null
│   └── todo/[id]/page.tsx # Modal content
├── layout.tsx
└── page.tsx
```

Layout intercepting modal:

```tsx
// app/layout.tsx
export default function RootLayout({
  children,
  modal,
}: {
  children: React.ReactNode
  modal: React.ReactNode
}) {
  return (
    <html>
      <body>
        {children}
        {modal}
      </body>
    </html>
  )
}
```

Modal route:

```tsx
// app/@modal/todo/[id]/page.tsx
import { Modal } from '@/components/ui/modal'
import { getTodo } from '@/lib/api'

export default async function TodoModal({ params }: { params: { id: string } }) {
  const todo = await getTodo(params.id)

  return (
    <Modal>
      <h2>{todo.title}</h2>
      <p>{todo.description}</p>
    </Modal>
  )
}
```
