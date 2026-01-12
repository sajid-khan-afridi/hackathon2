# Next.js Testing Guide

## Setup

### Jest Configuration

```js
// jest.config.js
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: ['**/__tests__/**/*.test.ts?(x)'],
}

module.exports = createJestConfig(customJestConfig)
```

### Jest Setup

```ts
// jest.setup.ts
import '@testing-library/jest-dom'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
  redirect: jest.fn(),
}))
```

## Component Testing

### Basic Component Test

```tsx
import { render, screen } from '@testing-library/react'
import { TodoItem } from '@/components/todo-item'

describe('TodoItem', () => {
  const todo = { id: '1', title: 'Test', completed: false }

  it('renders title', () => {
    render(<TodoItem todo={todo} />)
    expect(screen.getByText('Test')).toBeInTheDocument()
  })
})
```

### Testing User Interactions

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CreateTodoForm } from '@/components/create-todo-form'

describe('CreateTodoForm', () => {
  it('submits form with input value', async () => {
    const user = userEvent.setup()
    const mockAction = jest.fn()

    render(<CreateTodoForm onSubmit={mockAction} />)

    await user.type(screen.getByRole('textbox'), 'New task')
    await user.click(screen.getByRole('button', { name: /add/i }))

    expect(mockAction).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'New task' })
    )
  })

  it('shows validation error for empty input', async () => {
    const user = userEvent.setup()
    render(<CreateTodoForm />)

    await user.click(screen.getByRole('button', { name: /add/i }))

    expect(screen.getByText(/title required/i)).toBeInTheDocument()
  })
})
```

### Testing Async Components

```tsx
import { render, screen, waitFor } from '@testing-library/react'
import { TodoList } from '@/components/todo-list'

// Mock the API
jest.mock('@/lib/api', () => ({
  getTodos: jest.fn(),
}))

import { getTodos } from '@/lib/api'

describe('TodoList', () => {
  it('displays loading state', () => {
    (getTodos as jest.Mock).mockReturnValue(new Promise(() => {}))

    render(<TodoList />)

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('displays todos after loading', async () => {
    (getTodos as jest.Mock).mockResolvedValue([
      { id: '1', title: 'Task 1', completed: false },
      { id: '2', title: 'Task 2', completed: true },
    ])

    render(<TodoList />)

    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeInTheDocument()
      expect(screen.getByText('Task 2')).toBeInTheDocument()
    })
  })

  it('displays empty message when no todos', async () => {
    (getTodos as jest.Mock).mockResolvedValue([])

    render(<TodoList />)

    await waitFor(() => {
      expect(screen.getByText(/no tasks/i)).toBeInTheDocument()
    })
  })
})
```

## Mocking Patterns

### Mocking next/navigation

```tsx
import { useRouter, useSearchParams } from 'next/navigation'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
  usePathname: jest.fn(() => '/dashboard'),
}))

describe('FilterComponent', () => {
  const mockPush = jest.fn()

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush })
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams())
  })

  it('updates URL when filter changes', async () => {
    const user = userEvent.setup()
    render(<FilterComponent />)

    await user.click(screen.getByText('Completed'))

    expect(mockPush).toHaveBeenCalledWith('/dashboard?filter=completed')
  })
})
```

### Mocking Authentication

```tsx
jest.mock('@/lib/auth', () => ({
  useSession: jest.fn(),
  auth: jest.fn(),
}))

import { useSession, auth } from '@/lib/auth'

describe('ProtectedComponent', () => {
  it('shows content for authenticated user', () => {
    (useSession as jest.Mock).mockReturnValue({
      data: { user: { id: '1', name: 'Test User' } },
      isPending: false,
    })

    render(<ProtectedComponent />)

    expect(screen.getByText(/welcome/i)).toBeInTheDocument()
  })

  it('redirects unauthenticated user', () => {
    const mockRedirect = jest.fn()
    jest.mock('next/navigation', () => ({
      redirect: mockRedirect,
    }))

    (useSession as jest.Mock).mockReturnValue({
      data: null,
      isPending: false,
    })

    render(<ProtectedComponent />)

    expect(mockRedirect).toHaveBeenCalledWith('/login')
  })
})
```

### Mocking fetch

```tsx
describe('API calls', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('fetches todos successfully', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ id: '1', title: 'Test' }]),
    })

    const todos = await getTodos()

    expect(todos).toHaveLength(1)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/todos'),
      expect.any(Object)
    )
  })

  it('handles fetch error', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
    })

    await expect(getTodos()).rejects.toThrow()
  })
})
```

## API Route Testing

```tsx
import { GET, POST } from '@/app/api/todos/route'
import { NextRequest } from 'next/server'

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}))

import { auth } from '@/lib/auth'

describe('GET /api/todos', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  it('returns 401 for unauthenticated request', async () => {
    (auth as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/todos')
    const response = await GET(request)

    expect(response.status).toBe(401)
  })

  it('returns todos for authenticated user', async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: '1' } })
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ id: '1', title: 'Test' }]),
    })

    const request = new NextRequest('http://localhost/api/todos')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveLength(1)
  })
})

describe('POST /api/todos', () => {
  it('creates todo with valid data', async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: '1' } })
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: '2', title: 'New task' }),
    })

    const request = new NextRequest('http://localhost/api/todos', {
      method: 'POST',
      body: JSON.stringify({ title: 'New task' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.title).toBe('New task')
  })
})
```

## Server Action Testing

```tsx
import { createTodo } from '@/lib/actions'

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

describe('createTodo action', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  it('returns error for invalid input', async () => {
    const formData = new FormData()
    formData.set('title', '')

    const result = await createTodo(null, formData)

    expect(result).toEqual({ error: 'Title required' })
  })

  it('creates todo with valid input', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: '1', title: 'Test' }),
    })

    const formData = new FormData()
    formData.set('title', 'Test task')

    const result = await createTodo(null, formData)

    expect(result).toEqual({ success: true })
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ title: 'Test task' }),
      })
    )
  })
})
```

## Testing Hooks

```tsx
import { renderHook, act } from '@testing-library/react'
import { useTodos } from '@/hooks/use-todos'

describe('useTodos', () => {
  it('returns initial empty state', () => {
    const { result } = renderHook(() => useTodos())

    expect(result.current.todos).toEqual([])
    expect(result.current.isLoading).toBe(true)
  })

  it('adds todo', async () => {
    const { result } = renderHook(() => useTodos())

    await act(async () => {
      await result.current.addTodo('New task')
    })

    expect(result.current.todos).toContainEqual(
      expect.objectContaining({ title: 'New task' })
    )
  })
})
```

## Snapshot Testing

```tsx
import { render } from '@testing-library/react'
import { TodoCard } from '@/components/todo-card'

describe('TodoCard', () => {
  it('matches snapshot', () => {
    const { container } = render(
      <TodoCard
        todo={{ id: '1', title: 'Test', completed: false }}
      />
    )

    expect(container).toMatchSnapshot()
  })
})
```

## Test Utilities

```tsx
// test-utils.tsx
import { render, RenderOptions } from '@testing-library/react'
import { ReactElement } from 'react'

// Add providers here
function AllProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ThemeProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }
```

Usage:

```tsx
import { render, screen } from '@/test-utils'

describe('Component', () => {
  it('renders with providers', () => {
    render(<MyComponent />)
    // Component has access to all providers
  })
})
```
