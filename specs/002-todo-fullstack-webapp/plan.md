# Implementation Plan: Todo Full-Stack Web Application

**Branch**: `002-todo-fullstack-webapp` | **Date**: 2025-12-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-todo-fullstack-webapp/spec.md`

**Note**: This template is filled in by the `/sp.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Transform the Phase I console app into a modern multi-user web application with:
- **Frontend**: Next.js 16+ with App Router, TypeScript, Tailwind CSS
- **Backend**: FastAPI with SQLModel ORM, Python 3.13+
- **Database**: Neon Serverless PostgreSQL
- **Authentication**: Better Auth with JWT tokens
- **Deployment**: Vercel (frontend) + Railway/Render (backend)

The application provides user registration/authentication, CRUD operations for personal tasks with data isolation, and a responsive interface for desktop and mobile devices.

## Technical Context

**Language/Version**: Python 3.13+ (backend), TypeScript/JavaScript (frontend)
**Primary Dependencies**: FastAPI, SQLModel, Better Auth, Next.js 16+, Tailwind CSS
**Storage**: Neon Serverless PostgreSQL
**Testing**: pytest + pytest-asyncio (backend 80%), Jest + React Testing Library (frontend 60%)
**Target Platform**: Web (modern browsers - Chrome, Firefox, Safari, Edge latest 2 versions)
**Project Type**: Web application (monorepo with frontend/ and backend/ directories)
**Performance Goals**:
  - GET /api/tasks: < 100ms (max 500ms)
  - POST/PUT/DELETE operations: < 200ms (max 1s)
  - Frontend page load: < 1s (max 3s)
  - Frontend navigation: < 500ms (max 1s)
**Constraints**:
  - Backend memory: 512MB
  - Frontend bundle: < 200KB gzipped
  - Database connections: Pool size 10
  - JWT token expiry: 7 days
**Scale/Scope**:
  - Single instance deployment (development/demo)
  - Support users with up to 100 tasks (p95 latency target)
  - 7 user stories with 4 acceptance scenarios average

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Design Gates

| Gate | Status | Evidence |
|------|--------|----------|
| Spec-Driven Development | PASS | spec.md exists with 7 user stories, FR-001 to FR-017, and success criteria |
| Test-First Development | PASS | Testing requirements defined (80% backend, 60% frontend) |
| Security-First Design | PASS | JWT auth, user data isolation, input validation specified |
| Technology Stack Compliance | PASS | Next.js 16+, FastAPI, SQLModel, Neon, Better Auth per constitution |
| Library-First Architecture | PASS | Modular structure: models, services, routes, components |
| Simplicity/YAGNI | PASS | Only Basic Level features (no priorities, tags, recurring) |
| Documentation as Code | PASS | README.md, CLAUDE.md, specs/ structure planned |

### Complexity Budget

| Item | Constitution Limit | Planned | Status |
|------|-------------------|---------|--------|
| Projects | 3 max | 2 (frontend, backend) | PASS |
| API Endpoints | Reasonable | 6 REST endpoints | PASS |
| Database Tables | Minimal | 2 (users, tasks) | PASS |
| External Dependencies | Minimal viable | 4 core (FastAPI, SQLModel, Better Auth, Next.js) | PASS |

### Security Gates

| Requirement | Implementation |
|-------------|----------------|
| No hardcoded secrets | .env files (gitignored) |
| JWT authentication | Better Auth with shared secret |
| User data isolation | All queries filtered by user_id |
| Input validation | Pydantic models with constraints |
| HTTPS | Required for production |

## Project Structure

### Documentation (this feature)

```text
specs/002-todo-fullstack-webapp/
├── plan.md              # This file (/sp.plan command output)
├── research.md          # Phase 0 output (/sp.plan command)
├── data-model.md        # Phase 1 output (/sp.plan command)
├── quickstart.md        # Phase 1 output (/sp.plan command)
├── contracts/           # Phase 1 output (/sp.plan command)
│   └── openapi.yaml     # REST API specification
└── tasks.md             # Phase 2 output (/sp.tasks command - NOT created by /sp.plan)
```

### Source Code (repository root)

```text
phase2/
├── backend/
│   ├── src/
│   │   ├── __init__.py
│   │   ├── main.py           # FastAPI entry point
│   │   ├── config.py         # Settings and environment
│   │   ├── db.py             # Database connection
│   │   ├── models.py         # SQLModel database models (Task)
│   │   ├── schemas.py        # Pydantic request/response schemas
│   │   ├── auth.py           # JWT verification middleware
│   │   └── routes/
│   │       ├── __init__.py
│   │       ├── health.py     # Health check endpoint
│   │       └── tasks.py      # Task CRUD endpoints
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── conftest.py       # Test fixtures
│   │   ├── test_models.py
│   │   ├── test_auth.py
│   │   └── test_tasks.py     # API contract tests
│   ├── pyproject.toml
│   ├── .env.example
│   └── CLAUDE.md
│
├── frontend/
│   ├── src/
│   │   ├── app/              # App Router pages
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx      # Landing page
│   │   │   ├── (auth)/
│   │   │   │   ├── signin/page.tsx
│   │   │   │   └── signup/page.tsx
│   │   │   └── (dashboard)/
│   │   │       └── tasks/page.tsx
│   │   ├── components/
│   │   │   ├── ui/           # Base UI components
│   │   │   ├── TaskList.tsx
│   │   │   ├── TaskItem.tsx
│   │   │   ├── TaskForm.tsx
│   │   │   └── EmptyState.tsx
│   │   ├── lib/
│   │   │   ├── api.ts        # API client
│   │   │   ├── auth.ts       # Better Auth client
│   │   │   └── utils.ts
│   │   └── types/
│   │       └── index.ts      # TypeScript interfaces
│   ├── tests/
│   │   └── components/
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── .env.example
│   └── CLAUDE.md
│
├── docker-compose.yml        # Local development
├── README.md
└── CLAUDE.md
```

**Structure Decision**: Web application structure with separate `backend/` (FastAPI) and `frontend/` (Next.js) directories within `phase2/` folder, following the constitution's Phase II monorepo layout. This enables independent deployment to Vercel (frontend) and Railway/Render (backend).

## Complexity Tracking

> No constitution violations detected. All gates passed.
