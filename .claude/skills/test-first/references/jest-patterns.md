# Jest Patterns for Next.js Frontend

## Table of Contents

1. [Jest Configuration](#jest-configuration)
2. [React Testing Library Setup](#react-testing-library-setup)
3. [Component Testing](#component-testing)
4. [Hook Testing](#hook-testing)
5. [API Mocking with MSW](#api-mocking-with-msw)
6. [Auth Context Mocking](#auth-context-mocking)

## Jest Configuration

### jest.config.js

```javascript
// jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
};

module.exports = createJestConfig(customJestConfig);
```

### jest.setup.js

```javascript
// jest.setup.js
import '@testing-library/jest-dom';
import { server } from './src/mocks/server';

// MSW setup
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));
```

## React Testing Library Setup

### Test Utilities

```typescript
// src/test-utils.tsx
import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { AuthProvider } from '@/contexts/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

interface WrapperProps {
  children: React.ReactNode;
}

const AllProviders = ({ children }: WrapperProps) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
```

## Component Testing

### Basic Component Test

```typescript
// __tests__/components/TodoItem.test.tsx
import { render, screen, fireEvent } from '@/test-utils';
import { TodoItem } from '@/components/TodoItem';

describe('TodoItem', () => {
  const mockTodo = {
    id: '1',
    title: 'Test todo',
    completed: false,
    createdAt: new Date().toISOString(),
  };

  it('renders todo title', () => {
    render(<TodoItem todo={mockTodo} onToggle={jest.fn()} onDelete={jest.fn()} />);
    expect(screen.getByText('Test todo')).toBeInTheDocument();
  });

  it('calls onToggle when checkbox clicked', () => {
    const onToggle = jest.fn();
    render(<TodoItem todo={mockTodo} onToggle={onToggle} onDelete={jest.fn()} />);

    fireEvent.click(screen.getByRole('checkbox'));
    expect(onToggle).toHaveBeenCalledWith('1');
  });

  it('calls onDelete when delete button clicked', () => {
    const onDelete = jest.fn();
    render(<TodoItem todo={mockTodo} onToggle={jest.fn()} onDelete={onDelete} />);

    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(onDelete).toHaveBeenCalledWith('1');
  });

  it('shows completed state', () => {
    const completedTodo = { ...mockTodo, completed: true };
    render(<TodoItem todo={completedTodo} onToggle={jest.fn()} onDelete={jest.fn()} />);

    expect(screen.getByRole('checkbox')).toBeChecked();
    expect(screen.getByText('Test todo')).toHaveClass('line-through');
  });
});
```

### Form Component Test

```typescript
// __tests__/components/TodoForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@/test-utils';
import userEvent from '@testing-library/user-event';
import { TodoForm } from '@/components/TodoForm';

describe('TodoForm', () => {
  it('submits form with todo title', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();

    render(<TodoForm onSubmit={onSubmit} />);

    const input = screen.getByPlaceholderText(/add a todo/i);
    await user.type(input, 'New todo');
    await user.click(screen.getByRole('button', { name: /add/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ title: 'New todo' });
    });
  });

  it('clears input after submit', async () => {
    const user = userEvent.setup();
    render(<TodoForm onSubmit={jest.fn()} />);

    const input = screen.getByPlaceholderText(/add a todo/i);
    await user.type(input, 'New todo');
    await user.click(screen.getByRole('button', { name: /add/i }));

    await waitFor(() => {
      expect(input).toHaveValue('');
    });
  });

  it('prevents empty submission', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();

    render(<TodoForm onSubmit={onSubmit} />);
    await user.click(screen.getByRole('button', { name: /add/i }));

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
```

### Async Component Test

```typescript
// __tests__/components/TodoList.test.tsx
import { render, screen, waitFor } from '@/test-utils';
import { TodoList } from '@/components/TodoList';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';

describe('TodoList', () => {
  it('shows loading state', () => {
    render(<TodoList />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders todos after loading', async () => {
    render(<TodoList />);

    await waitFor(() => {
      expect(screen.getByText('Test todo 1')).toBeInTheDocument();
      expect(screen.getByText('Test todo 2')).toBeInTheDocument();
    });
  });

  it('shows empty state when no todos', async () => {
    server.use(
      http.get('/api/todos', () => {
        return HttpResponse.json([]);
      })
    );

    render(<TodoList />);

    await waitFor(() => {
      expect(screen.getByText(/no todos yet/i)).toBeInTheDocument();
    });
  });

  it('shows error state on failure', async () => {
    server.use(
      http.get('/api/todos', () => {
        return HttpResponse.error();
      })
    );

    render(<TodoList />);

    await waitFor(() => {
      expect(screen.getByText(/error loading todos/i)).toBeInTheDocument();
    });
  });
});
```

## Hook Testing

### Custom Hook Test

```typescript
// __tests__/hooks/useTodos.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTodos } from '@/hooks/useTodos';

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useTodos', () => {
  it('fetches todos', async () => {
    const { result } = renderHook(() => useTodos(), { wrapper });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveLength(2);
  });

  it('creates a todo', async () => {
    const { result } = renderHook(() => useTodos(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    result.current.createTodo({ title: 'New todo' });

    await waitFor(() => {
      expect(result.current.data).toHaveLength(3);
    });
  });
});
```

## API Mocking with MSW

### Mock Server Setup

```typescript
// src/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

const todos = [
  { id: '1', title: 'Test todo 1', completed: false },
  { id: '2', title: 'Test todo 2', completed: true },
];

export const handlers = [
  // Get todos
  http.get('/api/todos', () => {
    return HttpResponse.json(todos);
  }),

  // Create todo
  http.post('/api/todos', async ({ request }) => {
    const body = await request.json() as { title: string };
    const newTodo = {
      id: String(todos.length + 1),
      title: body.title,
      completed: false,
    };
    todos.push(newTodo);
    return HttpResponse.json(newTodo, { status: 201 });
  }),

  // Update todo
  http.patch('/api/todos/:id', async ({ params, request }) => {
    const { id } = params;
    const body = await request.json() as Partial<{ title: string; completed: boolean }>;
    const todo = todos.find((t) => t.id === id);
    if (!todo) {
      return HttpResponse.json({ detail: 'Not found' }, { status: 404 });
    }
    Object.assign(todo, body);
    return HttpResponse.json(todo);
  }),

  // Delete todo
  http.delete('/api/todos/:id', ({ params }) => {
    const { id } = params;
    const index = todos.findIndex((t) => t.id === id);
    if (index === -1) {
      return HttpResponse.json({ detail: 'Not found' }, { status: 404 });
    }
    todos.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
```

### Mock Server

```typescript
// src/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

### Override Handlers in Tests

```typescript
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';

it('handles server error', async () => {
  server.use(
    http.get('/api/todos', () => {
      return HttpResponse.json(
        { detail: 'Internal Server Error' },
        { status: 500 }
      );
    })
  );

  // Test error handling...
});
```

## Auth Context Mocking

### Auth Context Test Wrapper

```typescript
// src/test-utils.tsx
import { AuthContext, AuthContextType } from '@/contexts/AuthContext';

interface MockAuthProviderProps {
  children: React.ReactNode;
  value?: Partial<AuthContextType>;
}

export const MockAuthProvider = ({
  children,
  value = {},
}: MockAuthProviderProps) => {
  const defaultValue: AuthContextType = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: jest.fn(),
    logout: jest.fn(),
    ...value,
  };

  return (
    <AuthContext.Provider value={defaultValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Usage in tests
export const renderWithAuth = (
  ui: ReactElement,
  authValue?: Partial<AuthContextType>
) => {
  return render(
    <MockAuthProvider value={authValue}>{ui}</MockAuthProvider>
  );
};
```

### Testing Protected Components

```typescript
// __tests__/pages/dashboard.test.tsx
import { renderWithAuth, screen } from '@/test-utils';
import Dashboard from '@/app/dashboard/page';

describe('Dashboard', () => {
  it('shows login prompt when not authenticated', () => {
    renderWithAuth(<Dashboard />, { isAuthenticated: false });
    expect(screen.getByText(/please log in/i)).toBeInTheDocument();
  });

  it('shows dashboard when authenticated', () => {
    renderWithAuth(<Dashboard />, {
      isAuthenticated: true,
      user: { id: '1', email: 'test@example.com' },
    });
    expect(screen.getByText(/welcome/i)).toBeInTheDocument();
  });
});
```

### Testing Auth Flow

```typescript
// __tests__/components/LoginForm.test.tsx
import { render, screen, waitFor } from '@/test-utils';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '@/components/LoginForm';
import { useAuth } from '@/hooks/useAuth';

jest.mock('@/hooks/useAuth');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('LoginForm', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
    });
  });

  it('calls login with credentials', async () => {
    const user = userEvent.setup();
    const mockLogin = jest.fn().mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue({
      ...mockUseAuth(),
      login: mockLogin,
    });

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('shows error on invalid credentials', async () => {
    const user = userEvent.setup();
    const mockLogin = jest.fn().mockRejectedValue(new Error('Invalid credentials'));
    mockUseAuth.mockReturnValue({
      ...mockUseAuth(),
      login: mockLogin,
    });

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });
});
```
