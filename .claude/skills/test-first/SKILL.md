---
name: test-first
description: "Test-First Development (TDD) skill for Todo Full-Stack application. Use when: (1) Writing acceptance tests from spec scenarios, (2) Implementing Red-Green-Refactor cycle, (3) Creating pytest fixtures and test files, (4) Writing Jest and React Testing Library tests, (5) Achieving coverage targets (80% backend, 60% frontend), (6) Testing API contracts, (7) Mocking authentication in tests. This principle is NON-NEGOTIABLE. Tests MUST be written before implementation."
---

# Test-First Development

**NON-NEGOTIABLE PRINCIPLE:** Tests MUST be written BEFORE implementation code.

## The Law

```
1. Write a failing test (RED)
2. Write minimal code to pass (GREEN)
3. Refactor with confidence (REFACTOR)
4. Repeat
```

## Coverage Targets

| Layer | Target | Enforcement |
|-------|--------|-------------|
| Backend (Python/FastAPI) | 80% | `pytest --cov --cov-fail-under=80` |
| Frontend (Next.js) | 60% | `jest --coverage --coverageThreshold` |

## Workflow: Spec → Tests → Code

### Step 1: Extract Test Cases from Spec

Read `specs/<feature>/spec.md` scenarios and convert each to test cases:

```markdown
# Spec scenario
Given a user with no todos
When they create a todo "Buy milk"
Then they should see "Buy milk" in their list
```

```python
# Becomes test_todos.py
async def test_create_todo_adds_to_user_list(
    client: AsyncClient,
    auth_headers: dict,
):
    response = await client.post(
        "/api/v1/todos",
        json={"title": "Buy milk"},
        headers=auth_headers,
    )
    assert response.status_code == 201

    list_response = await client.get(
        "/api/v1/todos",
        headers=auth_headers,
    )
    titles = [t["title"] for t in list_response.json()]
    assert "Buy milk" in titles
```

### Step 2: Run Tests (Expect RED)

```bash
# Backend
cd backend && uv run pytest tests/test_todos.py -v

# Frontend
cd frontend && npm test -- --testPathPattern=todos
```

### Step 3: Write Minimal Implementation (GREEN)

Write only enough code to make the failing test pass. No more.

### Step 4: Refactor

With green tests, safely refactor. Run tests after each change.

## Quick Reference

### Backend Testing

See [references/pytest-patterns.md](references/pytest-patterns.md) for:
- Pytest fixtures for FastAPI TestClient
- Async test patterns with `pytest-asyncio`
- Database fixtures with test isolation
- Auth token fixtures
- Mocking external services

### Frontend Testing

See [references/jest-patterns.md](references/jest-patterns.md) for:
- Jest configuration for Next.js
- React Testing Library patterns
- Component testing strategies
- API mocking with MSW
- Auth context mocking

## Test File Naming

```
# Backend
tests/
├── conftest.py              # Shared fixtures
├── test_auth.py             # Auth endpoint tests
├── test_todos.py            # Todo CRUD tests
├── test_users.py            # User endpoint tests
└── test_integration.py      # Cross-feature tests

# Frontend
__tests__/
├── components/
│   ├── TodoItem.test.tsx
│   └── TodoList.test.tsx
├── pages/
│   ├── login.test.tsx
│   └── dashboard.test.tsx
└── hooks/
    └── useTodos.test.tsx
```

## Test Execution Commands

```bash
# Backend - run all tests with coverage
cd backend && uv run pytest --cov=src --cov-report=term-missing

# Backend - run specific test
cd backend && uv run pytest tests/test_todos.py::test_create_todo -v

# Frontend - run all tests with coverage
cd frontend && npm test -- --coverage

# Frontend - run in watch mode
cd frontend && npm test -- --watch

# Frontend - run specific test file
cd frontend && npm test -- TodoList.test.tsx
```

## Anti-Patterns to Avoid

| Anti-Pattern | Why It's Wrong | Correct Approach |
|--------------|----------------|------------------|
| Write code first, tests later | Tests become afterthoughts | Always RED first |
| Test implementation details | Brittle tests | Test behavior/contracts |
| Skip edge cases | Bugs in production | Test happy + error paths |
| Mock everything | False confidence | Prefer integration tests |
| Ignore flaky tests | Erode trust | Fix or delete immediately |

## Enforcement Checklist

Before marking any implementation task complete:

- [ ] Tests written BEFORE implementation
- [ ] All new code has corresponding tests
- [ ] Coverage meets threshold (80% backend, 60% frontend)
- [ ] Edge cases and error paths tested
- [ ] No skipped or pending tests
- [ ] CI passes all test stages
