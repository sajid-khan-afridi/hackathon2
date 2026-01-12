# Claude Code Rules - Phase II

## Surface

Phase II: Todo Full-Stack Web Application with Next.js frontend and FastAPI backend.

## Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Frontend | Next.js (App Router) | 15+ |
| Frontend | React | 19 |
| Frontend | TypeScript | 5.7+ |
| Frontend | Tailwind CSS | 3.4+ |
| Backend | FastAPI | 0.115+ |
| Backend | Python | 3.13+ |
| Backend | SQLModel | 0.0.22+ |
| Database | Neon PostgreSQL | Serverless |
| Auth | Better Auth | 1.2+ |

## Agent Skills

Apply these skills from `.claude/skills/` when implementing:

| Skill | Use When |
|-------|----------|
| `test-first` | Writing any implementation (RED-GREEN-REFACTOR) |
| `fastapi-backend` | Backend endpoints, models, auth |
| `nextjs-frontend` | Pages, components, API routes |
| `better-auth` | Authentication flows |
| `neon-database` | Database queries, migrations |

## Coverage Targets

| Layer | Target | Command |
|-------|--------|---------|
| Backend | 80% | `uv run pytest --cov=src --cov-fail-under=80` |
| Frontend | 60% | `npm test -- --coverage --coverageThreshold` |

## File Conventions

### Backend

```
src/
├── main.py           # FastAPI app with lifespan
├── config.py         # pydantic-settings
├── db.py             # SQLModel session
├── models.py         # Database models
├── schemas.py        # Request/response schemas
├── auth.py           # JWT verification
└── routes/           # API endpoints
    ├── health.py
    └── tasks.py
```

### Frontend

```
src/
├── app/              # Next.js App Router
│   ├── layout.tsx    # Root layout
│   ├── page.tsx      # Landing page
│   ├── (auth)/       # Auth route group
│   └── (dashboard)/  # Protected routes
├── components/       # React components
│   └── ui/           # Base UI components
├── lib/              # Utilities
│   ├── auth.ts       # Better Auth client
│   └── api.ts        # API client
└── types/            # TypeScript interfaces
```

## Key Patterns

### User Data Isolation

ALL task queries MUST filter by user_id:

```python
# CORRECT
tasks = session.exec(
    select(Task).where(Task.user_id == user_id)
).all()

# WRONG - security vulnerability
tasks = session.exec(select(Task)).all()
```

### Protected Routes

```typescript
// app/(dashboard)/layout.tsx
const session = await getServerSession();
if (!session) redirect("/signin");
```

### Test-First Development

1. Write failing test (RED)
2. Write minimal code to pass (GREEN)
3. Refactor with confidence

## Commands

### Backend

```bash
cd phase2/backend

# Development
uv run uvicorn src.main:app --reload

# Tests
uv run pytest -v
uv run pytest --cov=src

# Lint
uv run ruff check .
uv run black --check .
```

### Frontend

```bash
cd phase2/frontend

# Development
npm run dev

# Tests
npm test
npm run test:coverage

# Lint
npm run lint
```

## API Contract

See `specs/002-todo-fullstack-webapp/contracts/openapi.yaml` for the complete API specification.

Key endpoints:
- `GET /health` - Health check (no auth)
- `GET /api/{user_id}/tasks` - List tasks (auth required)
- `POST /api/{user_id}/tasks` - Create task (auth required)
- `GET /api/{user_id}/tasks/{task_id}` - Get task (auth required)
- `PUT /api/{user_id}/tasks/{task_id}` - Update task (auth required)
- `DELETE /api/{user_id}/tasks/{task_id}` - Delete task (auth required)
- `PATCH /api/{user_id}/tasks/{task_id}/complete` - Toggle completion (auth required)

## Security Checklist

- [ ] JWT tokens verified on every protected endpoint
- [ ] user_id in path matches authenticated user
- [ ] All database queries filter by user_id
- [ ] Input validated with Pydantic/Zod
- [ ] No secrets in code (use .env files)
- [ ] CORS configured for allowed origins only
