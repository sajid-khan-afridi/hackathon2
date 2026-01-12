# Evolution of Todo - Hackathon II Constitution

## Project Identity & Mission

### Project Name
**Evolution of Todo - Hackathon II**

### Purpose
Transform a simple Python console application into a fully-featured, cloud-native AI chatbot deployed on Kubernetes. This journey demonstrates mastery of Spec-Driven Development (SDD), the Nine Pillars of AI-Driven Development, and Cloud-Native AI technologies.

### Vision
Engineers shift from "syntax writers" to "system architects." AI agents execute; humans architect. Every feature is born from a specification, not improvisation.

### Success Metrics

| Metric | Target |
|--------|--------|
| Phases Completed | 5/5 |
| SDD Compliance | 100% (all code from specs) |
| Demo Readiness | 90-second video demonstrating all features |
| Documentation | Constitution, specs, PHRs, ADRs for every phase |
| Deployment | Vercel (frontend) + Cloud K8s (backend) |

### Learning Objectives

1. **Spec-Driven Development** - Using Claude Code and Spec-Kit Plus
2. **Reusable Intelligence** - Agent Skills and Subagent Development
3. **Full-Stack Development** - Next.js, FastAPI, SQLModel, Neon DB
4. **AI Agent Development** - OpenAI Agents SDK and Official MCP SDK
5. **Cloud-Native Deployment** - Docker, Kubernetes, Minikube, Helm Charts
6. **Event-Driven Architecture** - Kafka and Dapr
7. **AIOps** - kubectl-ai, kagent, and Claude Code
8. **Cloud-Native Blueprints** - Spec-Driven Deployment patterns

---

## Core Principles

### I. Spec-Driven Development (NON-NEGOTIABLE)

Every line of code MUST originate from a validated specification. No manual coding is permitted.

**Rules**:
- Constitution defines WHY (principles, constraints)
- Specification defines WHAT (requirements, acceptance criteria)
- Plan defines HOW (architecture, components)
- Tasks define WHEN/WHERE (ordered implementation steps)
- Workflow: `Specify → Plan → Tasks → Implement`
- All code MUST reference a Task ID; no Task ID = no code
- Claude Code generates all implementation from specs
- Refinement loop: If generated code fails acceptance, refine spec and regenerate

**Rationale**: Engineers shift from "syntax writers" to "system architects". AI agents execute; humans architect.

**Enforcement**:
- Code reviews verify Task ID references
- PRs rejected without corresponding spec artifacts
- PHR records capture spec-to-code traceability

---

### II. Test-First Development (NON-NEGOTIABLE)

Tests are written and approved before implementation begins. Red-Green-Refactor cycle is mandatory.

**Rules**:
- Write acceptance tests from spec scenarios FIRST
- Tests MUST fail before implementation begins (Red phase)
- Implement minimum code to pass tests (Green phase)
- Refactor only after tests pass (Refactor phase)
- Unit tests for isolated logic
- Integration tests for cross-component flows
- Contract tests for API boundaries
- E2E tests for user-facing web applications

**Rationale**: Tests validate specs before code exists; prevents spec drift and ensures correctness.

**Cycle**:
```
1. RED    → Write failing test from spec
2. GREEN  → Write minimum code to pass
3. REFACTOR → Clean up without breaking tests
4. REPEAT
```

---

### III. Library-First Architecture

Features are designed as standalone, reusable libraries before integration.

**Rules**:
- Every feature starts as an independent library/module
- Libraries MUST be self-contained and independently testable
- Clear purpose required - no organizational-only modules
- CLI interfaces expose functionality for debugging and automation
- Libraries follow single responsibility principle
- Cross-cutting concerns (logging, auth, validation) extracted into shared libs

**Rationale**: Modularity enables parallel development, independent testing, and code reuse across phases.

**Structure**:
```
src/
├── core/           # Core domain logic (Task model, operations)
├── storage/        # Storage abstraction (in-memory, database)
├── api/            # API layer (REST endpoints)
├── agents/         # AI agents (Phase III+)
├── mcp/            # MCP tools (Phase III+)
└── shared/         # Cross-cutting utilities
```

---

### IV. Security-First Design (NON-NEGOTIABLE)

Security is not an afterthought; it is baked into every design decision.

**Rules**:
- NEVER hardcode secrets, tokens, or credentials
- Use environment variables (.env) for all sensitive config
- JWT authentication with Better Auth for all protected endpoints
- All API routes validate JWT tokens before processing
- User data isolation: users ONLY access their own data
- Input validation on all user-provided data (title, description, message)
- HTTPS required for all external communications
- Secrets managed via Kubernetes Secrets or Dapr Secrets in production

**Rationale**: A todo app managing user tasks handles personal data; breaches destroy trust.

**Secrets Hierarchy**:
| Phase | Method |
|-------|--------|
| Phase I | N/A (no secrets) |
| Phase II-III | .env files (gitignored) |
| Phase IV | Kubernetes Secrets |
| Phase V | Dapr Secrets API |

---

### V. Stateless Architecture

Server components hold no session state; all state persists in the database.

**Rules**:
- Backend servers are stateless (horizontally scalable)
- Conversation state persists to database (Neon PostgreSQL)
- JWT tokens are self-contained credentials (no session store)
- Any server instance can handle any request
- Server restarts MUST NOT lose application state
- MCP tools are stateless; all state stored in database

**Rationale**: Stateless design enables Kubernetes horizontal scaling, load balancing, and resilience.

**Benefits**:
- Horizontal scaling with load balancers
- Zero-downtime deployments
- Fault tolerance (any pod can serve any request)
- Simplified debugging (no hidden state)

---

### VI. Simplicity and YAGNI

Start simple. Do not implement features until explicitly required.

**Rules**:
- "You Aren't Gonna Need It" - no speculative features
- Smallest viable diff for each task
- Do not refactor unrelated code
- Begin with in-memory storage (Phase I), evolve to database (Phase II)
- Start with basic CRUD, add complexity only when spec demands
- No premature optimization; measure before optimizing
- Three strikes rule: abstract only after three similar implementations

**Rationale**: Complexity is the enemy of delivery; simpler systems are easier to debug, test, and maintain.

**Anti-Patterns to Avoid**:
- Adding "just in case" parameters
- Building extensibility not required by current phase
- Over-engineering simple CRUD operations
- Creating abstractions for single use cases

---

### VII. Observability and Debugging

Systems MUST be observable in production; debugging MUST be possible at every layer.

**Rules**:
- Structured logging required (JSON format in production)
- Log levels: ERROR, WARN, INFO, DEBUG
- Log context: timestamp, request_id, user_id, operation
- Text I/O protocols ensure debuggability (CLI tools)
- API responses include request_id for tracing
- Kubernetes deployments include liveness and readiness probes
- Metrics collection for performance monitoring (Phase IV/V)

**Rationale**: "If you can't observe it, you can't fix it"; production debugging requires visibility.

**Log Format**:
```json
{
  "timestamp": "2025-12-28T10:30:00Z",
  "level": "INFO",
  "request_id": "abc123",
  "user_id": "user_456",
  "operation": "create_task",
  "message": "Task created successfully",
  "task_id": 42
}
```

---

### VIII. Event-Driven Design

Decoupled services communicate via events, not direct API calls.

**Applicability**: Phase V (Advanced Cloud Deployment)

**Rules**:
- Kafka topics for event streaming (task-events, reminders, task-updates)
- Producers publish events; consumers process independently
- Events are immutable facts (created, updated, completed, deleted)
- Event schemas versioned and documented
- Dapr abstracts event infrastructure (Pub/Sub component)
- Services loose-coupled via events; swap implementations without code changes

**Rationale**: Event-driven architecture enables scalability, resilience, and feature decoupling (recurring tasks, notifications, audit logs).

**Event Schema**:
```json
{
  "event_type": "task.created",
  "task_id": 42,
  "user_id": "user_456",
  "timestamp": "2025-12-28T10:30:00Z",
  "data": {
    "title": "Buy groceries",
    "description": "Milk, eggs, bread"
  }
}
```

**Topics**:
| Topic | Producer | Consumers |
|-------|----------|-----------|
| task-events | Chat API | Audit Service, Recurring Task Service |
| reminders | Chat API | Notification Service |
| task-updates | Chat API | WebSocket Service |

---

### IX. Cloud-Native Patterns

Design for containerized, orchestrated deployment from Phase IV onward.

**Rules**:
- Applications containerized with Docker (Gordon AI for assistance)
- Helm charts for Kubernetes deployments
- ConfigMaps for configuration, Secrets for sensitive data
- Horizontal Pod Autoscaling for scalability
- Service Mesh patterns via Dapr (service invocation, secrets, pub/sub)
- CI/CD pipelines for automated deployment (Phase V)
- Infrastructure as Code: Helm charts, Dapr components YAML

**Rationale**: Cloud-native patterns are the future of deployment; mastering them is a core hackathon objective.

**12-Factor App Compliance**:
| Factor | Implementation |
|--------|---------------|
| I. Codebase | Single repo, multiple deploys |
| II. Dependencies | requirements.txt, package.json |
| III. Config | Environment variables |
| IV. Backing services | Neon DB, Kafka as attached resources |
| V. Build, release, run | Docker + Helm + CI/CD |
| VI. Processes | Stateless containers |
| VII. Port binding | Container exposes port |
| VIII. Concurrency | HPA scaling |
| IX. Disposability | Fast startup, graceful shutdown |
| X. Dev/prod parity | Docker Compose locally, K8s in prod |
| XI. Logs | Stdout streams |
| XII. Admin processes | One-off K8s jobs |

---

### X. Documentation as Code

Documentation is a first-class artifact, versioned alongside code.

**Rules**:
- README.md in every project root with setup instructions
- CLAUDE.md with Claude Code instructions
- specs/ folder with all specification files
- PHR records for every significant development session
- ADRs for architecturally significant decisions
- API documentation via OpenAPI/Swagger (FastAPI auto-generates)
- Quickstart guides for each phase

**Rationale**: Future developers (including AI agents) need context; undocumented code is unmaintainable.

**Required Documentation**:
| Document | Location | Purpose |
|----------|----------|---------|
| README.md | Root | Setup, prerequisites, quickstart |
| CLAUDE.md | Root + subdirs | AI agent instructions |
| constitution.md | .specify/memory/ | Project principles |
| spec.md | specs/{feature}/ | Feature requirements |
| plan.md | specs/{feature}/ | Architecture decisions |
| tasks.md | specs/{feature}/ | Implementation tasks |
| PHRs | history/prompts/ | Session records |
| ADRs | history/adr/ | Architectural decisions |

---

## Technology Stack Constraints

### Phase I: In-Memory Python Console App

| Layer | Technology | Version | Requirement |
|-------|-----------|---------|-------------|
| Language | Python | 3.13+ | REQUIRED |
| Package Manager | UV | Latest | REQUIRED |
| AI Agent | Claude Code | Latest | REQUIRED |
| SDD Framework | Spec-Kit Plus | Latest | REQUIRED |
| Storage | In-memory (dict/list) | N/A | No persistence |
| Testing | pytest | Latest | REQUIRED |
| Type Checking | mypy | Latest | RECOMMENDED |
| Formatting | black | Latest | REQUIRED |
| Linting | ruff | Latest | REQUIRED |

**Project Structure**:
```
phase1/
├── src/
│   ├── __init__.py
│   ├── main.py           # CLI entry point
│   ├── models.py         # Task model
│   ├── storage.py        # In-memory storage
│   └── operations.py     # CRUD operations
├── tests/
│   ├── __init__.py
│   ├── test_models.py
│   ├── test_storage.py
│   └── test_operations.py
├── pyproject.toml
├── README.md
└── CLAUDE.md
```

**Deviations**: NONE ALLOWED

---

### Phase II: Full-Stack Web Application

**Objective:**
Transform the Phase I console app into a modern multi-user web application with persistent storage using Claude Code and Spec-Kit Plus.

**Scope (In):**
- All 5 Basic Level features implemented as a web application (Add, Delete, Update, View, Mark Complete)
- RESTful API endpoints for all task operations
- Responsive frontend interface with Next.js App Router
- Persistent data storage in Neon Serverless PostgreSQL database
- User authentication with signup/signin using Better Auth with JWT
- Multi-user support with user data isolation
- Frontend deployment to Vercel

**Out of Scope (Not in this phase):**
- AI chatbot functionality (Phase III)
- Kubernetes deployment (Phase IV)
- Event-driven architecture (Phase V)
- Intermediate/Advanced level features (Priorities, Tags, Recurring Tasks, Due Dates)
- Voice commands or multi-language support

**Deliverables:**
1. GitHub repository with:
   - Constitution file (this document)
   - specs/ history folder containing all specification files
   - frontend/ folder with Next.js source code
   - backend/ folder with FastAPI source code
   - README.md with setup instructions
   - CLAUDE.md with Claude Code instructions (root + subdirectories)
   - .spec-kit/config.yaml for Spec-Kit Plus configuration

2. Working web application demonstrating:
   - User signup and signin functionality
   - Adding tasks with title and description
   - Listing all tasks with status indicators (user-specific)
   - Updating task details
   - Deleting tasks by ID
   - Marking tasks as complete/incomplete

3. Published deployment:
   - Frontend deployed to Vercel (free tier)
   - Backend API accessible for frontend

**Architecture & Components:**

| Layer | Technology | Version | Requirement |
|-------|-----------|---------|-------------|
| Frontend | Next.js | 16+ (App Router) | REQUIRED |
| Frontend Language | TypeScript | Latest | REQUIRED |
| Styling | Tailwind CSS | v3+ | REQUIRED |
| Backend | FastAPI | Latest | REQUIRED |
| Backend Language | Python | 3.13+ | REQUIRED |
| ORM | SQLModel | Latest | REQUIRED |
| Database | Neon PostgreSQL | Serverless | REQUIRED |
| Authentication | Better Auth | Latest | REQUIRED with JWT |
| Deployment | Vercel (frontend) | Free tier | REQUIRED |
| AI Agent | Claude Code | Latest | REQUIRED |
| SDD Framework | Spec-Kit Plus | Latest | REQUIRED |

**Monorepo Structure**:
```
hackathon-todo/
├── .spec-kit/                    # Spec-Kit Plus configuration
│   └── config.yaml
├── specs/                        # Spec-Kit managed specifications
│   ├── overview.md               # Project overview
│   ├── architecture.md           # System architecture
│   ├── features/                 # Feature specifications
│   │   ├── task-crud.md
│   │   └── authentication.md
│   ├── api/                      # API specifications
│   │   └── rest-endpoints.md
│   ├── database/                 # Database specifications
│   │   └── schema.md
│   └── ui/                       # UI specifications
│       ├── components.md
│       └── pages.md
├── frontend/
│   ├── src/
│   │   ├── app/                  # App Router pages
│   │   ├── components/           # UI components
│   │   ├── lib/                  # API client, utilities
│   │   └── types/                # TypeScript types
│   ├── tests/
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── CLAUDE.md
├── backend/
│   ├── src/
│   │   ├── main.py               # FastAPI entry point
│   │   ├── models.py             # SQLModel database models
│   │   ├── routes/               # API route handlers
│   │   ├── services/             # Business logic
│   │   └── db.py                 # Database connection
│   ├── tests/
│   ├── pyproject.toml
│   └── CLAUDE.md
├── docker-compose.yml
├── README.md
└── CLAUDE.md                     # Root Claude Code instructions
```

**Key Workflows / User Stories:**

| User Story | Acceptance Criteria |
|------------|---------------------|
| As a user, I can sign up for an account | Email/password registration, unique email validation, redirect to tasks page |
| As a user, I can sign in to my account | Email/password authentication, JWT token issued, redirect to tasks page |
| As a user, I can create a new task | Title required (1-200 chars), description optional (max 2000 chars), task associated with logged-in user |
| As a user, I can view all my tasks | Only show tasks for current user, display title/status/created date, support status filtering |
| As a user, I can update a task | Modify title and/or description, task ownership verified |
| As a user, I can delete a task | Remove task by ID, task ownership verified, confirmation response |
| As a user, I can mark a task complete | Toggle completion status, task ownership verified |
| As a user, I only see my own data | All queries filtered by authenticated user_id, 403 if accessing other user's data |

**APIs & Contracts:**

**Base URL**:
- Development: `http://localhost:8000`
- Production: Deployed backend URL

**Authentication**: All task endpoints require JWT token in header:
```
Authorization: Bearer <token>
```

**REST API Endpoints**:

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | /api/{user_id}/tasks | List all tasks | - | Task[] |
| POST | /api/{user_id}/tasks | Create a new task | {title, description?} | Task |
| GET | /api/{user_id}/tasks/{id} | Get task details | - | Task |
| PUT | /api/{user_id}/tasks/{id} | Update a task | {title?, description?} | Task |
| DELETE | /api/{user_id}/tasks/{id} | Delete a task | - | {success: true} |
| PATCH | /api/{user_id}/tasks/{id}/complete | Toggle completion | - | Task |

**Query Parameters** (for GET /api/{user_id}/tasks):
- `status`: "all" | "pending" | "completed"
- `sort`: "created" | "title" | "due_date"

**Task Response Format**:
```json
{
  "id": 1,
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "completed": false,
  "created_at": "2025-12-28T10:00:00Z",
  "updated_at": "2025-12-28T10:00:00Z"
}
```

**Error Response Format**:
```json
{
  "detail": "Task not found",
  "status_code": 404,
  "request_id": "abc123"
}
```

**Data & Storage:**

**Database Schema**:

**users table** (managed by Better Auth):
| Column | Type | Constraints |
|--------|------|-------------|
| id | string | PRIMARY KEY |
| email | string | UNIQUE, NOT NULL |
| name | string | NOT NULL |
| created_at | timestamp | DEFAULT now() |

**tasks table**:
| Column | Type | Constraints |
|--------|------|-------------|
| id | integer | PRIMARY KEY, AUTO INCREMENT |
| user_id | string | FOREIGN KEY → users.id, NOT NULL |
| title | string | NOT NULL, max 200 chars |
| description | text | NULLABLE, max 2000 chars |
| completed | boolean | DEFAULT false |
| created_at | timestamp | DEFAULT now() |
| updated_at | timestamp | DEFAULT now(), ON UPDATE now() |

**Indexes**:
- `tasks.user_id` (for filtering by user)
- `tasks.completed` (for status filtering)

**Security & Privacy:**

**JWT Authentication Flow**:
1. User logs in on Frontend → Better Auth creates session and issues JWT token
2. Frontend makes API call → Includes JWT token in `Authorization: Bearer <token>` header
3. Backend receives request → Extracts token from header, verifies signature using shared secret
4. Backend identifies user → Decodes token to get user_id, matches with URL user_id
5. Backend filters data → Returns only tasks belonging to that user

**Required Configuration Changes**:

| Component | Changes Required |
|-----------|------------------|
| Better Auth Config | Enable JWT plugin to issue tokens |
| Frontend API Client | Attach JWT token to every API request header |
| FastAPI Backend | Add middleware to verify JWT and extract user |
| API Routes | Filter all queries by the authenticated user's ID |

**Shared Secret**: Both frontend (Better Auth) and backend (FastAPI) MUST use the same secret key (`BETTER_AUTH_SECRET`) for JWT signing and verification.

**Security Benefits**:
- User Isolation: Each user only sees their own tasks
- Stateless Auth: Backend doesn't need to call frontend to verify users
- Token Expiry: JWTs expire automatically (default 7 days)
- No Shared DB Session: Frontend and backend verify auth independently

**API Behavior After Auth Implementation**:
- All endpoints require valid JWT token
- Requests without token receive 401 Unauthorized
- Each user only sees/modifies their own tasks
- Task ownership is enforced on every operation

**Input Validation**:
| Field | Validation | Error |
|-------|------------|-------|
| title | Required, 1-200 chars, not empty/whitespace | 400 Bad Request |
| description | Optional, max 2000 chars | 400 Bad Request |
| task_id | Positive integer | 400 Bad Request |
| user_id | Non-empty string (from JWT) | 401 Unauthorized |
| status filter | Enum: all, pending, completed | 400 Bad Request |

**Testing & Quality Gates (Definition of Done):**

| Test Type | Framework | Coverage Target |
|-----------|-----------|-----------------|
| Backend unit tests | pytest + pytest-asyncio | 80% |
| Backend contract tests | pytest + httpx | All API endpoints |
| Frontend unit tests | Jest + React Testing Library | 60% |
| E2E tests | Playwright (optional) | Critical paths |

**Quality Checklist**:
- [ ] All 5 Basic Level features working via web UI
- [ ] All API endpoints return correct responses
- [ ] JWT authentication working end-to-end
- [ ] User data isolation verified (user A cannot see user B's tasks)
- [ ] Input validation working on all endpoints
- [ ] Error responses follow standard format
- [ ] 80% backend test coverage achieved
- [ ] 60% frontend test coverage achieved
- [ ] No secrets committed to repository
- [ ] TypeScript strict mode enabled, no `any` types
- [ ] Python type hints on all function signatures
- [ ] Linting passes (ruff for Python, ESLint for TypeScript)
- [ ] Formatting applied (black for Python, Prettier for TypeScript)
- [ ] Documentation complete (README, CLAUDE.md files)

**Observability (logs/metrics/tracing):**

**Logging Requirements**:
- Structured JSON logging in production
- Log levels: ERROR, WARN, INFO, DEBUG
- Log context: timestamp, request_id, user_id, operation

**Log Format**:
```json
{
  "timestamp": "2025-12-28T10:30:00Z",
  "level": "INFO",
  "request_id": "abc123",
  "user_id": "user_456",
  "operation": "create_task",
  "message": "Task created successfully",
  "task_id": 42
}
```

**Response Time Budgets**:
| Operation | Target | Max Acceptable |
|-----------|--------|----------------|
| GET /api/tasks (list) | < 100ms | < 500ms |
| POST /api/tasks (create) | < 200ms | < 1s |
| PUT/DELETE /api/tasks | < 200ms | < 1s |
| Frontend page load | < 1s | < 3s |
| Frontend navigation | < 500ms | < 1s |

**Milestones / Checklist:**

- [ ] **M1: Project Setup**
  - [ ] Initialize monorepo structure
  - [ ] Configure Spec-Kit Plus (.spec-kit/config.yaml)
  - [ ] Create CLAUDE.md files (root + frontend + backend)
  - [ ] Set up Neon PostgreSQL database
  - [ ] Configure environment variables (.env files)

- [ ] **M2: Backend Foundation**
  - [ ] Implement SQLModel models (Task)
  - [ ] Set up database connection (db.py)
  - [ ] Create FastAPI application entry point
  - [ ] Implement health check endpoint

- [ ] **M3: REST API Implementation**
  - [ ] GET /api/{user_id}/tasks (list tasks)
  - [ ] POST /api/{user_id}/tasks (create task)
  - [ ] GET /api/{user_id}/tasks/{id} (get task)
  - [ ] PUT /api/{user_id}/tasks/{id} (update task)
  - [ ] DELETE /api/{user_id}/tasks/{id} (delete task)
  - [ ] PATCH /api/{user_id}/tasks/{id}/complete (toggle complete)

- [ ] **M4: Authentication Integration**
  - [ ] Configure Better Auth with JWT plugin
  - [ ] Implement user signup/signin pages
  - [ ] Create JWT verification middleware (FastAPI)
  - [ ] Attach JWT tokens to API requests (frontend)
  - [ ] Implement user data isolation in all queries

- [ ] **M5: Frontend Implementation**
  - [ ] Create Next.js App Router pages (home, auth, tasks)
  - [ ] Build TaskList component
  - [ ] Build TaskForm component (create/edit)
  - [ ] Build TaskItem component
  - [ ] Implement API client (lib/api.ts)
  - [ ] Style with Tailwind CSS

- [ ] **M6: Testing & Quality**
  - [ ] Write backend unit tests (80% coverage)
  - [ ] Write backend contract tests
  - [ ] Write frontend unit tests (60% coverage)
  - [ ] Verify all quality gates pass
  - [ ] Fix linting/formatting issues

- [ ] **M7: Deployment & Documentation**
  - [ ] Deploy frontend to Vercel
  - [ ] Verify production environment
  - [ ] Update README with setup instructions
  - [ ] Create PHR records for development sessions
  - [ ] Final demo verification

**Due Date**: December 14, 2025
**Points**: 150

**Development Approach**: Use the Agentic Dev Stack workflow: Write spec → Generate plan → Break into tasks → Implement via Claude Code. No manual coding allowed. Refinement loop: If generated code fails acceptance, refine spec and regenerate.

**Deviations**: NONE ALLOWED for core stack

---

### Phase III: AI-Powered Todo Chatbot

| Layer | Technology | Version | Requirement |
|-------|-----------|---------|-------------|
| Chat UI | OpenAI ChatKit | Latest | REQUIRED |
| AI Framework | OpenAI Agents SDK | Latest | REQUIRED |
| MCP Server | Official MCP SDK (Python) | Latest | REQUIRED |
| Backend | FastAPI | Same as Phase II | REQUIRED |
| Database | Neon PostgreSQL | Same as Phase II | REQUIRED |
| Authentication | Better Auth | Same as Phase II | REQUIRED |

**Additional Structure**:
```
backend/
├── src/
│   ├── agents/
│   │   ├── __init__.py
│   │   └── todo_agent.py     # OpenAI Agent definition
│   ├── mcp/
│   │   ├── __init__.py
│   │   ├── server.py         # MCP server setup
│   │   └── tools/            # MCP tool implementations
│   │       ├── add_task.py
│   │       ├── list_tasks.py
│   │       ├── complete_task.py
│   │       ├── delete_task.py
│   │       └── update_task.py
│   └── routes/
│       └── chat.py           # POST /api/{user_id}/chat
```

**Deviations**: NONE ALLOWED for core stack

---

### Phase IV: Local Kubernetes Deployment

| Layer | Technology | Version | Requirement |
|-------|-----------|---------|-------------|
| Containerization | Docker | Docker Desktop 4.53+ | REQUIRED |
| Docker AI | Gordon | Latest | OPTIONAL (region-dependent) |
| Orchestration | Kubernetes | Minikube | REQUIRED |
| Package Manager | Helm Charts | v3+ | REQUIRED |
| AI DevOps | kubectl-ai | Latest | REQUIRED |
| AI DevOps | kagent | Latest | REQUIRED |
| Application | Phase III Chatbot | N/A | REQUIRED |

**Additional Structure**:
```
hackathon-todo/
├── k8s/
│   ├── helm/
│   │   ├── todo-frontend/
│   │   │   ├── Chart.yaml
│   │   │   ├── values.yaml
│   │   │   └── templates/
│   │   │       ├── deployment.yaml
│   │   │       ├── service.yaml
│   │   │       └── ingress.yaml
│   │   └── todo-backend/
│   │       ├── Chart.yaml
│   │       ├── values.yaml
│   │       └── templates/
│   │           ├── deployment.yaml
│   │           ├── service.yaml
│   │           ├── configmap.yaml
│   │           └── secret.yaml
│   └── minikube/
│       └── setup.sh
├── Dockerfile.frontend
└── Dockerfile.backend
```

**Deviations**: Gordon optional if region-restricted; use standard Docker CLI

---

### Phase V: Advanced Cloud Deployment

| Layer | Technology | Version | Requirement |
|-------|-----------|---------|-------------|
| Cloud Provider | Azure AKS / GCP GKE / Oracle OKE / DigitalOcean DOKS | Free tier | REQUIRED (choose one) |
| Event Streaming | Kafka | Strimzi / Redpanda / Confluent | REQUIRED |
| Distributed Runtime | Dapr | Latest | REQUIRED |
| CI/CD | GitHub Actions | Latest | REQUIRED |
| Monitoring | Cloud provider native | N/A | REQUIRED |

**Dapr Components**:
```
k8s/
├── dapr-components/
│   ├── pubsub.yaml           # Kafka pub/sub
│   ├── statestore.yaml       # PostgreSQL state
│   ├── secretstore.yaml      # K8s secrets
│   └── scheduler.yaml        # Jobs API
```

**Deviations**: Cloud provider choice flexible; Kafka provider flexible if Dapr abstracts it

---

## Architecture Standards

### Monorepo Organization

```
hackathon-todo/
├── .specify/                    # Spec-Kit Plus configuration
│   ├── memory/
│   │   └── constitution.md      # THIS FILE
│   ├── templates/               # Spec templates
│   └── scripts/                 # Automation scripts
├── .claude/
│   └── commands/                # Claude Code commands
├── specs/                       # Feature specifications
│   ├── overview.md
│   ├── architecture.md
│   ├── features/
│   │   ├── task-crud.md
│   │   ├── authentication.md
│   │   └── chatbot.md
│   ├── api/
│   │   ├── rest-endpoints.md
│   │   └── mcp-tools.md
│   ├── database/
│   │   └── schema.md
│   └── ui/
│       ├── components.md
│       └── pages.md
├── history/                     # Development history
│   ├── prompts/                 # PHR records
│   │   ├── constitution/
│   │   ├── general/
│   │   └── {feature-name}/
│   └── adr/                     # Architecture decisions
├── frontend/                    # Next.js app
├── backend/                     # FastAPI app
├── k8s/                         # Kubernetes configs
├── .github/
│   └── workflows/               # CI/CD pipelines
├── CLAUDE.md
├── README.md
└── docker-compose.yml
```

---

### REST API Design (Phase II)

**Base URL**:
- Development: `http://localhost:8000`
- Production: `https://api.{your-domain}.com`

**Authentication**: All endpoints require JWT token in header:
```
Authorization: Bearer <token>
```

**Endpoints**:

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | /api/{user_id}/tasks | List all tasks | - | Task[] |
| POST | /api/{user_id}/tasks | Create task | {title, description?} | Task |
| GET | /api/{user_id}/tasks/{id} | Get task | - | Task |
| PUT | /api/{user_id}/tasks/{id} | Update task | {title?, description?} | Task |
| DELETE | /api/{user_id}/tasks/{id} | Delete task | - | {success: true} |
| PATCH | /api/{user_id}/tasks/{id}/complete | Toggle complete | - | Task |

**Response Format**:
```json
{
  "id": 1,
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "completed": false,
  "created_at": "2025-12-28T10:00:00Z",
  "updated_at": "2025-12-28T10:00:00Z"
}
```

**Error Format**:
```json
{
  "detail": "Task not found",
  "status_code": 404,
  "request_id": "abc123"
}
```

---

### MCP Tools Specification (Phase III)

**Tool: add_task**
| Attribute | Value |
|-----------|-------|
| Purpose | Create a new task |
| Parameters | user_id (string, required), title (string, required), description (string, optional) |
| Returns | {task_id, status, title} |
| Example Input | {"user_id": "user123", "title": "Buy groceries", "description": "Milk, eggs"} |
| Example Output | {"task_id": 5, "status": "created", "title": "Buy groceries"} |

**Tool: list_tasks**
| Attribute | Value |
|-----------|-------|
| Purpose | Retrieve tasks |
| Parameters | user_id (string, required), status (string, optional: "all", "pending", "completed") |
| Returns | Array of task objects |
| Example Input | {"user_id": "user123", "status": "pending"} |
| Example Output | [{"id": 1, "title": "Buy groceries", "completed": false}] |

**Tool: complete_task**
| Attribute | Value |
|-----------|-------|
| Purpose | Mark task as complete |
| Parameters | user_id (string, required), task_id (integer, required) |
| Returns | {task_id, status, title} |
| Example Input | {"user_id": "user123", "task_id": 3} |
| Example Output | {"task_id": 3, "status": "completed", "title": "Call mom"} |

**Tool: delete_task**
| Attribute | Value |
|-----------|-------|
| Purpose | Remove a task |
| Parameters | user_id (string, required), task_id (integer, required) |
| Returns | {task_id, status, title} |
| Example Input | {"user_id": "user123", "task_id": 2} |
| Example Output | {"task_id": 2, "status": "deleted", "title": "Old task"} |

**Tool: update_task**
| Attribute | Value |
|-----------|-------|
| Purpose | Modify task details |
| Parameters | user_id (string, required), task_id (integer, required), title (string, optional), description (string, optional) |
| Returns | {task_id, status, title} |
| Example Input | {"user_id": "user123", "task_id": 1, "title": "Buy groceries and fruits"} |
| Example Output | {"task_id": 1, "status": "updated", "title": "Buy groceries and fruits"} |

---

### Database Schema (Phase II+)

```sql
-- Managed by Better Auth
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Core task table
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT FALSE,
    priority VARCHAR(10) DEFAULT 'medium',     -- Phase V: low, medium, high
    due_date TIMESTAMP,                         -- Phase V
    recurring_pattern VARCHAR(50),              -- Phase V: daily, weekly, monthly
    tags TEXT[],                                -- Phase V
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Chat history (Phase III+)
CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES conversations(id),
    user_id VARCHAR(255) NOT NULL REFERENCES users(id),
    role VARCHAR(20) NOT NULL,  -- 'user' or 'assistant'
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_completed ON tasks(completed);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
```

---

## Code Quality Standards

### Python Standards

| Standard | Requirement | Tool |
|----------|-------------|------|
| Style | PEP 8 compliance | black |
| Type Hints | All function signatures | mypy |
| Async | I/O operations | async/await |
| Docstrings | Google-style for public functions | - |
| Imports | Sorted and organized | isort |
| Linting | Code quality checks | ruff |
| Line Length | Max 100 characters | black |
| Exceptions | Specific, not bare except | - |

**Example**:
```python
from typing import Optional
from datetime import datetime

async def create_task(
    user_id: str,
    title: str,
    description: Optional[str] = None
) -> Task:
    """Create a new task for the specified user.

    Args:
        user_id: The ID of the user creating the task.
        title: The title of the task (1-200 characters).
        description: Optional task description (max 2000 chars).

    Returns:
        The created Task object.

    Raises:
        ValueError: If title is empty or exceeds 200 characters.
        PermissionError: If user_id doesn't match authenticated user.
    """
    if not title or len(title) > 200:
        raise ValueError("Title must be 1-200 characters")

    task = Task(
        user_id=user_id,
        title=title,
        description=description,
        created_at=datetime.utcnow()
    )
    await db.save(task)
    return task
```

---

### TypeScript Standards

| Standard | Requirement | Tool |
|----------|-------------|------|
| Strict Mode | tsconfig.json with strict: true | TypeScript |
| Linting | Recommended rules | ESLint |
| Formatting | Consistent style | Prettier |
| Type Safety | No `any` types | TypeScript |
| Components | Functional with hooks | React |
| Server Components | Default in App Router | Next.js |
| Client Components | Only when needed | "use client" |
| Imports | Absolute with @/ alias | tsconfig.json |

**Example**:
```typescript
interface Task {
  id: number;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CreateTaskParams {
  title: string;
  description?: string;
}

export async function createTask(
  userId: string,
  params: CreateTaskParams
): Promise<Task> {
  const response = await fetch(`/api/${userId}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`,
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Failed to create task: ${response.statusText}`);
  }

  return response.json();
}
```

---

### Naming Conventions

| Category | Convention | Example |
|----------|------------|---------|
| Python files | snake_case | task_service.py |
| Python classes | PascalCase | TaskService |
| Python functions | snake_case | create_task() |
| Python constants | UPPER_SNAKE | MAX_TITLE_LENGTH |
| Python private | _prefix | _validate_input() |
| TypeScript files | kebab-case | task-list.tsx |
| React components | PascalCase | TaskList |
| TypeScript interfaces | PascalCase | Task, CreateTaskParams |
| TypeScript functions | camelCase | createTask() |
| CSS classes | kebab-case | task-item, task-list |
| Database tables | snake_case plural | tasks, users |
| Database columns | snake_case | user_id, created_at |
| API endpoints | kebab-case | /api/tasks/{id}/complete |
| Environment variables | UPPER_SNAKE | DATABASE_URL |
| Git branches | kebab-case | phase-1-task-crud |
| Helm releases | kebab-case | todo-backend |

---

## Security Requirements

### Authentication (Phase II+)

**Better Auth Configuration**:
- JWT plugin enabled for token issuance
- Token stored in secure httpOnly cookie OR Authorization header
- Token expiration: 7 days (configurable via BETTER_AUTH_TOKEN_EXPIRY)
- Refresh token rotation enabled
- Shared secret: BETTER_AUTH_SECRET (same in frontend and backend)

**Token Flow**:
```
1. User logs in → Frontend sends credentials to Better Auth
2. Better Auth validates → Issues JWT token
3. Frontend stores token → Attaches to all API requests
4. Backend middleware → Extracts and verifies token
5. Backend identifies user → Filters data by user_id
```

**Backend Verification**:
```python
from fastapi import Depends, HTTPException, Header
import jwt

async def get_current_user(authorization: str = Header(...)) -> str:
    """Extract and verify JWT token, return user_id."""
    try:
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(
            token,
            settings.BETTER_AUTH_SECRET,
            algorithms=["HS256"]
        )
        return payload["sub"]  # user_id
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
```

---

### Authorization

**User Data Isolation**:
- All database queries filtered by authenticated user_id
- Task ownership verified on every operation
- 403 Forbidden if user_id mismatch

**Enforcement Example**:
```python
async def get_task(task_id: int, user_id: str = Depends(get_current_user)) -> Task:
    task = await db.get(Task, task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    return task
```

---

### Secrets Management

| Phase | Method | Location |
|-------|--------|----------|
| Phase I | N/A | No secrets needed |
| Phase II-III | .env files | Root directory (gitignored) |
| Phase IV | Kubernetes Secrets | k8s/helm/*/templates/secret.yaml |
| Phase V | Dapr Secrets API | k8s/dapr-components/secretstore.yaml |

**Required Secrets**:
| Secret | Purpose | Phases |
|--------|---------|--------|
| DATABASE_URL | Neon PostgreSQL connection | II-V |
| BETTER_AUTH_SECRET | JWT signing key | II-V |
| OPENAI_API_KEY | OpenAI Agents SDK | III-V |
| KAFKA_BOOTSTRAP_SERVERS | Event streaming | V |
| KAFKA_SASL_USERNAME | Kafka auth | V |
| KAFKA_SASL_PASSWORD | Kafka auth | V |

**Gitignore Requirements**:
```gitignore
# Environment files
.env
.env.local
.env.*.local

# Kubernetes secrets
**/secret.yaml
**/secrets.yaml

# IDE
.idea/
.vscode/
```

---

### Input Validation

| Field | Validation | Error |
|-------|------------|-------|
| title | Required, 1-200 chars | 400 Bad Request |
| description | Optional, max 2000 chars | 400 Bad Request |
| task_id | Positive integer | 400 Bad Request |
| user_id | Non-empty string (from JWT) | 401 Unauthorized |
| message | Non-empty string | 400 Bad Request |
| status filter | Enum: all, pending, completed | 400 Bad Request |

**Validation Example**:
```python
from pydantic import BaseModel, Field, validator

class CreateTaskRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str | None = Field(None, max_length=1000)

    @validator('title')
    def title_not_empty(cls, v):
        if not v.strip():
            raise ValueError('Title cannot be empty or whitespace')
        return v.strip()
```

---

## Testing Requirements

### Testing Strategy by Phase

**Phase I: Python Console App**
| Test Type | Framework | Coverage Target |
|-----------|-----------|----------------|
| Unit tests | pytest | 80% |
| Integration tests | pytest | Core workflows |

**Phase II: Full-Stack Web App**
| Layer | Framework | Coverage Target |
|-------|-----------|----------------|
| Backend unit | pytest + pytest-asyncio | 80% |
| Backend contract | pytest + httpx | API endpoints |
| Frontend unit | Jest + React Testing Library | 60% |
| E2E | Playwright (optional) | Critical paths |

**Phase III: AI Chatbot**
| Test Type | Framework | Coverage Target |
|-----------|-----------|----------------|
| MCP tool unit | pytest | 80% |
| Agent integration | pytest (mock OpenAI) | Core flows |
| Conversation flow | pytest | Happy paths |

**Phase IV-V: Kubernetes**
| Test Type | Tool | Target |
|-----------|------|--------|
| Helm validation | helm lint | All charts |
| Manifest validation | kubectl --dry-run | All manifests |
| Smoke tests | curl/httpie | Post-deployment |

---

### Test Organization

```
tests/
├── unit/                    # Isolated function tests
│   ├── test_models.py
│   ├── test_storage.py
│   └── test_operations.py
├── contract/                # API contract tests
│   ├── test_tasks_api.py
│   └── test_chat_api.py
├── integration/             # Cross-component tests
│   ├── test_auth_flow.py
│   └── test_mcp_tools.py
└── e2e/                     # End-to-end user flows
    └── test_complete_flow.py
```

---

### Test Coverage Requirements

| Phase | Component | Minimum |
|-------|-----------|---------|
| Phase I | All code | 80% |
| Phase II | Backend | 80% |
| Phase II | Frontend | 60% |
| Phase III | Backend + MCP | 70% |
| Phase IV-V | Validation only | N/A |

**Coverage Enforcement**:
```bash
# Phase I
pytest --cov=src --cov-report=term-missing --cov-fail-under=80

# Phase II Backend
pytest backend/tests --cov=backend/src --cov-fail-under=80
```

---

## Performance Standards

### Response Time Budgets

| Operation | Target | Max Acceptable |
|-----------|--------|----------------|
| GET /api/tasks (list) | < 100ms | < 500ms |
| POST /api/tasks (create) | < 200ms | < 1s |
| PUT/DELETE /api/tasks | < 200ms | < 1s |
| POST /api/chat (AI) | < 3s | < 10s |
| Frontend page load | < 1s | < 3s |
| Frontend navigation | < 500ms | < 1s |

---

### Resource Constraints

| Resource | Phase I-III | Phase IV-V |
|----------|-------------|------------|
| Backend memory | 512MB | 512Mi per pod |
| Backend CPU | N/A | 500m (0.5 cores) |
| Frontend bundle | N/A | < 200KB gzipped |
| Database connections | Pool size 10 | Pool size 10 |
| Container image | N/A | < 500MB |

---

### Scalability Expectations

| Phase | Configuration |
|-------|---------------|
| Phase II-III | Single instance (development) |
| Phase IV | Minikube: 2 replicas per service |
| Phase V | HPA: min 2, max 10 replicas |

**HPA Configuration** (Phase V):
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: todo-backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: todo-backend
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

---

## Development Workflow

### SDD Workflow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   SPECIFY   │────▶│    PLAN     │────▶│    TASKS    │────▶│  IMPLEMENT  │
│   (WHAT)    │     │    (HOW)    │     │   (WHEN)    │     │   (CODE)    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       │                  │                   │                    │
       ▼                  ▼                   ▼                    ▼
   spec.md            plan.md            tasks.md            src/*.py
```

**Commands**:
| Command | Purpose | Output |
|---------|---------|--------|
| /sp.specify | Capture requirements | specs/{feature}/spec.md |
| /sp.clarify | Ask clarifying questions | Updated spec.md |
| /sp.plan | Generate architecture | specs/{feature}/plan.md |
| /sp.tasks | Create implementation tasks | specs/{feature}/tasks.md |
| /sp.implement | Execute tasks | Source code |
| /sp.analyze | Cross-artifact check | Validation report |
| /sp.adr | Document decisions | history/adr/*.md |
| /sp.phr | Record session | history/prompts/*.md |

---

### Git Workflow

**Branch Naming**:
```
{phase}-{feature-name}
```
Examples:
- `phase-1-task-crud`
- `phase-2-authentication`
- `phase-3-chatbot`
- `phase-4-kubernetes`
- `phase-5-dapr-kafka`

**Commit Message Format** (Conventional Commits):
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types**:
| Type | Purpose |
|------|---------|
| feat | New feature |
| fix | Bug fix |
| docs | Documentation |
| refactor | Code refactoring |
| test | Adding tests |
| chore | Build, CI/CD, deps |
| style | Formatting (no logic) |

**Examples**:
```
feat(phase-1): implement add task functionality
fix(phase-2): correct JWT token validation
docs(constitution): add security requirements section
test(phase-3): add MCP tool unit tests
chore(phase-4): add Dockerfile for backend
```

---

### Code Review Checklist

Before merging any PR, verify:

- [ ] Spec compliance verified (references Task ID)
- [ ] Tests written and passing
- [ ] No secrets committed
- [ ] Type hints complete (Python/TypeScript)
- [ ] Documentation updated
- [ ] Linting passes (ruff, ESLint)
- [ ] Formatting applied (black, Prettier)
- [ ] PHR created for significant changes
- [ ] ADR created if architecturally significant

---

## Deployment Standards

### Docker Containerization (Phase IV+)

**Dockerfile Requirements**:
- Multi-stage builds for smaller images
- Non-root user in containers
- Health check endpoints
- .dockerignore to exclude unnecessary files

**Backend Dockerfile Template**:
```dockerfile
# Build stage
FROM python:3.13-slim AS builder
WORKDIR /app
COPY pyproject.toml .
RUN pip install --no-cache-dir uv && \
    uv pip install --system -r pyproject.toml

# Runtime stage
FROM python:3.13-slim
WORKDIR /app

# Create non-root user
RUN useradd --create-home appuser
USER appuser

# Copy only necessary files
COPY --from=builder /usr/local/lib/python3.13/site-packages /usr/local/lib/python3.13/site-packages
COPY src/ ./src/

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
    CMD curl -f http://localhost:8000/health || exit 1

EXPOSE 8000
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Frontend Dockerfile Template**:
```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Runtime stage
FROM node:20-alpine
WORKDIR /app

RUN adduser --disabled-password appuser
USER appuser

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
```

---

### Kubernetes Patterns (Phase IV+)

**Required Resources**:
| Resource | Purpose |
|----------|---------|
| Deployment | Stateless service pods |
| Service | Internal communication |
| Ingress | External access |
| ConfigMap | Non-sensitive configuration |
| Secret | Sensitive data |
| HPA | Auto-scaling (Phase V) |

**Health Probes**:
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8000
  initialDelaySeconds: 10
  periodSeconds: 30

readinessProbe:
  httpGet:
    path: /health
    port: 8000
  initialDelaySeconds: 5
  periodSeconds: 10
```

---

### Helm Chart Conventions

**Directory Structure**:
```
helm/todo-backend/
├── Chart.yaml              # Chart metadata
├── values.yaml             # Default values
├── values-dev.yaml         # Development overrides
├── values-prod.yaml        # Production overrides
└── templates/
    ├── _helpers.tpl        # Template helpers
    ├── deployment.yaml
    ├── service.yaml
    ├── ingress.yaml
    ├── configmap.yaml
    ├── secret.yaml
    └── hpa.yaml            # Phase V
```

**Chart.yaml Template**:
```yaml
apiVersion: v2
name: todo-backend
description: FastAPI backend for Todo Chatbot
type: application
version: 0.1.0
appVersion: "1.0.0"
```

---

### CI/CD Requirements (Phase V)

**GitHub Actions Workflows**:
```
.github/workflows/
├── lint.yml                # Code linting
├── test.yml                # Run tests
├── build.yml               # Build Docker images
└── deploy.yml              # Deploy to K8s
```

**Workflow Triggers**:
| Workflow | Trigger | Actions |
|----------|---------|---------|
| lint | Push, PR | ruff, ESLint |
| test | Push, PR | pytest, Jest |
| build | Push to main | Docker build, push to registry |
| deploy | Release tag | Helm upgrade |

---

## Governance

### Constitution Hierarchy

```
Constitution (WHY - Principles, Constraints)
    │
    └── Supersedes all other artifacts
        │
        └── Specification (WHAT - Requirements)
            │
            └── Defines acceptance criteria
                │
                └── Plan (HOW - Architecture)
                    │
                    └── Defines components, interfaces
                        │
                        └── Tasks (WHEN/WHERE - Implementation)
                            │
                            └── Ordered, testable work units
```

**Conflict Resolution**:
- Constitution > Specification > Plan > Tasks
- Security > Performance > Features
- Simplicity > Completeness

---

### Amendment Process

**Versioning** (MAJOR.MINOR.PATCH):
| Change | Version Bump |
|--------|-------------|
| Principle removal/redefinition | MAJOR |
| New principle/section added | MINOR |
| Clarifications, typos | PATCH |

**Amendment Steps**:
1. Propose amendment with rationale
2. Document in ADR if architecturally significant
3. Update constitution version
4. Update dependent templates if needed
5. Commit with message: `docs: amend constitution to vX.Y.Z`

---

### Non-Negotiables List

These principles CANNOT be amended during the hackathon:

| # | Principle | Reason |
|---|-----------|--------|
| 1 | Spec-Driven Development | Core hackathon requirement |
| 2 | Test-First Development | Quality assurance |
| 3 | Security-First Design | User data protection |
| 4 | Technology Stack (per phase) | Hackathon constraints |

---

### Decision Hierarchy

For conflicts between goals:
1. **Security** over Performance
2. **Correctness** over Speed
3. **Simplicity** over Extensibility
4. **Delivery** over Perfection

---

## Feature Progression Tracking

### Basic Level (Required - All Phases)

- [ ] **Add Task** - Create new todo items with title and description
- [ ] **Delete Task** - Remove tasks from the list by ID
- [ ] **Update Task** - Modify existing task details
- [ ] **View Task List** - Display all tasks with status indicators
- [ ] **Mark as Complete** - Toggle task completion status

### Intermediate Level (Phase V Part A)

- [ ] **Priorities** - Assign levels (high/medium/low)
- [ ] **Tags/Categories** - Labels for organization (work/home)
- [ ] **Search & Filter** - Search by keyword; filter by status, priority, date
- [ ] **Sort Tasks** - Reorder by due date, priority, or alphabetically

### Advanced Level (Phase V Part A)

- [ ] **Recurring Tasks** - Auto-reschedule repeating tasks (daily, weekly, monthly)
- [ ] **Due Dates & Time Reminders** - Set deadlines with notifications

---

## Appendix

### Environment Variables Reference

| Variable | Description | Phases | Required |
|----------|-------------|--------|----------|
| DATABASE_URL | Neon PostgreSQL connection string | II-V | Yes |
| BETTER_AUTH_SECRET | JWT signing secret (32+ chars) | II-V | Yes |
| BETTER_AUTH_URL | Better Auth server URL | II-V | Yes |
| OPENAI_API_KEY | OpenAI API key for agents | III-V | Yes |
| NEXT_PUBLIC_API_URL | Backend API URL for frontend | II-V | Yes |
| NEXT_PUBLIC_OPENAI_DOMAIN_KEY | ChatKit domain key | III-V | Yes |
| KAFKA_BOOTSTRAP_SERVERS | Kafka broker addresses | V | Yes |
| KAFKA_SASL_USERNAME | Kafka authentication | V | Conditional |
| KAFKA_SASL_PASSWORD | Kafka authentication | V | Conditional |

### Quick Reference Commands

**Development**:
```bash
# Phase I
cd phase1 && uv run python -m src.main

# Phase II+
cd backend && uvicorn src.main:app --reload
cd frontend && npm run dev

# Docker Compose
docker-compose up
```

**Testing**:
```bash
# Backend
pytest --cov=src --cov-report=term-missing

# Frontend
npm test
```

**Kubernetes**:
```bash
# Minikube
minikube start
helm install todo-backend ./k8s/helm/todo-backend
helm install todo-frontend ./k8s/helm/todo-frontend

# kubectl-ai
kubectl-ai "check pod status for todo-backend"
```

---

**Version**: 1.0.0
**Ratified**: 2025-12-28
**Last Amended**: 2025-12-28
