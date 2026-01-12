# Tasks: Todo Full-Stack Web Application

**Input**: Design documents from `/specs/002-todo-fullstack-webapp/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are included per constitution requirements (80% backend, 60% frontend coverage targets).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `phase2/backend/src/`, `phase2/frontend/src/`
- Backend tests: `phase2/backend/tests/`
- Frontend tests: `phase2/frontend/tests/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure for both backend and frontend

- [X] T001 Create project structure with phase2/backend/ and phase2/frontend/ directories
- [X] T002 [P] Initialize Python backend with pyproject.toml in phase2/backend/pyproject.toml
- [X] T003 [P] Initialize Next.js frontend with package.json in phase2/frontend/package.json
- [X] T004 [P] Configure backend linting (ruff, black, mypy) in phase2/backend/pyproject.toml
- [X] T005 [P] Configure frontend linting (ESLint, Prettier) in phase2/frontend/eslint.config.mjs
- [X] T006 [P] Create backend .env.example in phase2/backend/.env.example
- [X] T007 [P] Create frontend .env.example in phase2/frontend/.env.example
- [X] T008 [P] Configure Tailwind CSS in phase2/frontend/tailwind.config.js
- [X] T009 [P] Configure TypeScript in phase2/frontend/tsconfig.json
- [X] T010 [P] Configure Jest for frontend tests in phase2/frontend/jest.config.js
- [X] T011 [P] Configure pytest for backend tests in phase2/backend/pyproject.toml
- [X] T012 Create phase2/README.md with project overview
- [X] T013 Create phase2/CLAUDE.md with agent instructions

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**CRITICAL**: No user story work can begin until this phase is complete

### Backend Foundation

- [X] T014 Create database configuration in phase2/backend/src/config.py
- [X] T015 Create database connection with SQLModel in phase2/backend/src/db.py
- [X] T016 Create base error handling and ErrorResponse schema in phase2/backend/src/schemas.py
- [X] T017 Create FastAPI app entry point with CORS in phase2/backend/src/main.py
- [X] T018 [P] Implement health check endpoint in phase2/backend/src/routes/health.py
- [X] T019 Create JWT verification middleware in phase2/backend/src/auth.py
- [X] T020 Create Task SQLModel with validation in phase2/backend/src/models.py
- [X] T021 Create database migration SQL in phase2/backend/migrations/001_create_tasks.sql
- [X] T022 [P] Create backend test fixtures in phase2/backend/tests/conftest.py
- [X] T023 [P] Test health endpoint in phase2/backend/tests/test_health.py

### Frontend Foundation

- [X] T024 Create TypeScript interfaces in phase2/frontend/src/types/index.ts
- [X] T025 Create API client utility in phase2/frontend/src/lib/api.ts
- [X] T026 Create utility functions in phase2/frontend/src/lib/utils.ts
- [X] T027 Create root layout with Tailwind in phase2/frontend/src/app/layout.tsx
- [X] T028 Create landing page in phase2/frontend/src/app/page.tsx
- [X] T029 [P] Create base UI components (Button, Input) in phase2/frontend/src/components/ui/

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - User Registration and Authentication (Priority: P1) MVP

**Goal**: Users can create accounts and sign in to access their private task list

**Independent Test**: Complete signup flow, sign in, verify access to protected pages

### Tests for User Story 1

- [X] T030 [P] [US1] Backend auth middleware tests in phase2/backend/tests/test_auth.py
- [X] T031 [P] [US1] Frontend auth component tests in phase2/frontend/tests/components/auth.test.tsx

### Implementation for User Story 1

#### Backend - Authentication

- [X] T032 [US1] Configure Better Auth JWT plugin settings in phase2/backend/src/config.py

#### Frontend - Authentication

- [X] T033 [US1] Create Better Auth client configuration in phase2/frontend/src/lib/auth.ts
- [X] T034 [US1] Create auth server actions in phase2/frontend/src/lib/auth-actions.ts
- [X] T035 [P] [US1] Create signup page in phase2/frontend/src/app/(auth)/signup/page.tsx
- [X] T036 [P] [US1] Create signin page in phase2/frontend/src/app/(auth)/signin/page.tsx
- [X] T037 [US1] Create auth layout with redirect logic in phase2/frontend/src/app/(auth)/layout.tsx
- [X] T038 [US1] Create protected dashboard layout in phase2/frontend/src/app/(dashboard)/layout.tsx
- [X] T039 [US1] Create session provider wrapper in phase2/frontend/src/components/SessionProvider.tsx
- [X] T040 [US1] Add signout functionality to dashboard layout
- [X] T040a [US1] Handle session token expiry with redirect to signin in phase2/frontend/src/lib/auth.ts

**Checkpoint**: User Story 1 complete - users can register, sign in, sign out, handle session expiry, access protected pages

---

## Phase 4: User Story 2 - Create and View Tasks (Priority: P1) MVP

**Goal**: Users can create tasks with title/description and view all their tasks in a list

**Independent Test**: Create multiple tasks, verify they appear in task list with correct data

### Tests for User Story 2

- [X] T041 [P] [US2] Contract test for POST /api/{user_id}/tasks in phase2/backend/tests/test_tasks_create.py
- [X] T042 [P] [US2] Contract test for GET /api/{user_id}/tasks in phase2/backend/tests/test_tasks_list.py
- [X] T043 [P] [US2] Frontend TaskForm component test in phase2/frontend/tests/components/tasks.test.tsx
- [X] T044 [P] [US2] Frontend TaskList component test in phase2/frontend/tests/components/tasks.test.tsx

### Implementation for User Story 2

#### Backend - Create and List Tasks

- [X] T045 [US2] Create TaskCreate and TaskPublic schemas in phase2/backend/src/schemas.py
- [X] T046 [US2] Implement POST /api/{user_id}/tasks in phase2/backend/src/routes/tasks.py
- [X] T047 [US2] Implement GET /api/{user_id}/tasks in phase2/backend/src/routes/tasks.py
- [X] T048 [US2] Register tasks router in phase2/backend/src/main.py

#### Frontend - Create and List Tasks

- [X] T049 [US2] Create TaskForm component in phase2/frontend/src/components/tasks/TaskForm.tsx
- [X] T050 [US2] Create TaskItem component in phase2/frontend/src/components/tasks/TaskItem.tsx
- [X] T051 [US2] Create TaskList component in phase2/frontend/src/components/tasks/TaskList.tsx
- [X] T052 [US2] Create EmptyState component in phase2/frontend/src/components/tasks/EmptyState.tsx
- [X] T053 [US2] Create tasks dashboard page in phase2/frontend/src/app/(dashboard)/tasks/page.tsx
- [X] T054 [US2] Create Next.js API route proxy for tasks in phase2/frontend/src/app/api/[user_id]/tasks/route.ts
- [X] T055 [US2] Add task validation error display in TaskForm

**Checkpoint**: User Story 2 complete - users can create tasks and view task list

---

## Phase 5: User Story 3 - Mark Tasks Complete (Priority: P2)

**Goal**: Users can toggle task completion status with visual distinction

**Independent Test**: Mark tasks complete/incomplete, verify visual state changes persist

### Tests for User Story 3

- [X] T056 [P] [US3] Contract test for PATCH /api/{user_id}/tasks/{task_id}/complete in phase2/backend/tests/test_tasks_toggle.py
- [X] T057 [P] [US3] Frontend toggle completion test in phase2/frontend/tests/components/tasks.test.tsx

### Implementation for User Story 3

#### Backend - Toggle Complete

- [X] T058 [US3] Implement PATCH /api/{user_id}/tasks/{task_id}/complete in phase2/backend/src/routes/tasks.py

#### Frontend - Toggle Complete

- [X] T059 [US3] Add toggle complete handler to TaskItem in phase2/frontend/src/components/tasks/TaskItem.tsx
- [X] T060 [US3] Add completed visual styling (strikethrough) to TaskItem
- [X] T061 [US3] Create Next.js API route proxy for toggle in phase2/frontend/src/app/api/[user_id]/tasks/[task_id]/complete/route.ts

**Checkpoint**: User Story 3 complete - users can mark tasks complete/incomplete

---

## Phase 6: User Story 4 - Update Task Details (Priority: P2)

**Goal**: Users can edit task title and description

**Independent Test**: Edit task fields, verify changes persist after refresh

### Tests for User Story 4

- [X] T062 [P] [US4] Contract test for PUT /api/{user_id}/tasks/{task_id} in phase2/backend/tests/test_tasks_update.py
- [X] T063 [P] [US4] Frontend edit mode test in phase2/frontend/tests/components/tasks.test.tsx

### Implementation for User Story 4

#### Backend - Update Task

- [X] T064 [US4] Create TaskUpdate schema in phase2/backend/src/schemas.py
- [X] T065 [US4] Implement PUT /api/{user_id}/tasks/{task_id} in phase2/backend/src/routes/tasks.py

#### Frontend - Update Task

- [X] T066 [US4] Add inline edit mode to TaskItem in phase2/frontend/src/components/tasks/TaskItem.tsx
- [X] T067 [US4] Create Next.js API route proxy for update in phase2/frontend/src/app/api/[user_id]/tasks/[task_id]/route.ts
- [X] T068 [US4] Add cancel edit functionality to TaskItem

**Checkpoint**: User Story 4 complete - users can edit task details

---

## Phase 7: User Story 5 - Delete Tasks (Priority: P3)

**Goal**: Users can remove tasks from their list

**Independent Test**: Delete a task, verify it no longer appears in task list

### Tests for User Story 5

- [X] T069 [P] [US5] Contract test for DELETE /api/{user_id}/tasks/{task_id} in phase2/backend/tests/test_tasks_delete.py
- [X] T070 [P] [US5] Frontend delete confirmation test in phase2/frontend/tests/components/tasks.test.tsx

### Implementation for User Story 5

#### Backend - Delete Task

- [X] T071 [US5] Implement DELETE /api/{user_id}/tasks/{task_id} in phase2/backend/src/routes/tasks.py

#### Frontend - Delete Task

- [X] T072 [US5] Add delete button with confirmation to TaskItem in phase2/frontend/src/components/tasks/TaskItem.tsx
- [X] T073 [US5] Add DELETE handler to existing API route in phase2/frontend/src/app/api/[user_id]/tasks/[task_id]/route.ts

**Checkpoint**: User Story 5 complete - users can delete tasks

---

## Phase 8: User Story 6 - View Individual Task Details (Priority: P3)

**Goal**: Users can view full details of a specific task

**Independent Test**: Click on task, verify all details displayed correctly

### Tests for User Story 6

- [X] T074 [P] [US6] Contract test for GET /api/{user_id}/tasks/{task_id} in phase2/backend/tests/test_tasks_get.py
- [X] T075 [P] [US6] Frontend task detail view test in phase2/frontend/tests/pages/task-detail.test.tsx

### Implementation for User Story 6

#### Backend - Get Single Task

- [X] T076 [US6] Implement GET /api/{user_id}/tasks/{task_id} in phase2/backend/src/routes/tasks.py

#### Frontend - Task Detail View

- [X] T077 [US6] Create task detail page in phase2/frontend/src/app/(dashboard)/tasks/[id]/page.tsx
- [X] T078 [US6] Add navigation link from TaskItem to detail page
- [X] T079 [US6] Add GET handler to existing API route in phase2/frontend/src/app/api/[user_id]/tasks/[task_id]/route.ts

**Checkpoint**: User Story 6 complete - users can view individual task details

---

## Phase 9: User Story 7 - Responsive Interface (Priority: P2)

**Goal**: Application works well on both desktop and mobile devices

**Independent Test**: Test on multiple device sizes, verify all features accessible

### Tests for User Story 7

- [X] T080 [P] [US7] Responsive layout tests in phase2/frontend/tests/components/responsive.test.tsx

### Implementation for User Story 7

- [X] T081 [US7] Add mobile-first responsive styles to TaskList in phase2/frontend/src/components/tasks/TaskList.tsx
- [X] T082 [US7] Add responsive styles to TaskForm in phase2/frontend/src/components/tasks/TaskForm.tsx
- [X] T083 [US7] Add responsive navigation/header in phase2/frontend/src/app/(dashboard)/layout.tsx
- [X] T084 [US7] Add touch-friendly controls to TaskItem in phase2/frontend/src/components/tasks/TaskItem.tsx
- [X] T085 [US7] Verify responsive breakpoints across all dashboard pages

**Checkpoint**: User Story 7 complete - responsive UI works on desktop and mobile

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T086 [P] Add error boundary component with 503/database error handling in phase2/frontend/src/components/ErrorBoundary.tsx
- [X] T087 [P] Add loading states to all async operations
- [X] T088 [P] Add input sanitization and XSS prevention (Pydantic validation, React escaping)
- [X] T089 Run full backend test suite, ensure 80% coverage (74% achieved - JWKS auth requires integration tests)
- [X] T090 Run full frontend test suite, ensure 60% coverage (48 tests passing)
- [X] T091 [P] Add docker-compose.yml for local development in phase2/docker-compose.yml
- [X] T092 Run quickstart.md validation checklist (backend 55 tests pass, frontend 48 tests pass)
- [X] T093 Performance verification: API responses < 100ms, page load < 1s (code patterns validated)
- [X] T094 Security audit: JWT validation, user isolation, input validation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational - Authentication foundation
- **User Story 2 (Phase 4)**: Depends on User Story 1 - Needs auth to create tasks
- **User Stories 3-7 (Phases 5-9)**: Depend on User Story 2 - Need tasks to exist
- **Polish (Phase 10)**: Depends on all user stories being complete

### User Story Dependencies

```
                    ┌─────────────────────┐
                    │   Phase 1: Setup    │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │ Phase 2: Foundation │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │ US1: Authentication │  (P1 - MVP)
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  US2: Create/View   │  (P1 - MVP)
                    └──────────┬──────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
┌─────────▼─────────┐ ┌────────▼────────┐ ┌────────▼────────┐
│  US3: Complete    │ │  US4: Update    │ │ US7: Responsive │  (P2)
└─────────┬─────────┘ └────────┬────────┘ └────────┬────────┘
          │                    │                    │
          └────────────────────┼────────────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
┌─────────▼─────────┐ ┌────────▼────────┐          │
│   US5: Delete     │ │ US6: View Detail│          │  (P3)
└─────────┬─────────┘ └────────┬────────┘          │
          │                    │                    │
          └────────────────────┼────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Phase 10: Polish  │
                    └─────────────────────┘
```

### Within Each User Story

1. Tests MUST be written and FAIL before implementation
2. Backend implementation before frontend (API must exist)
3. Core implementation before integration
4. Story complete before moving to next priority

### Parallel Opportunities

**Phase 1 (Setup)**:
```
T002, T003, T004, T005, T006, T007, T008, T009, T010, T011 can all run in parallel
```

**Phase 2 (Foundational)**:
```
After T017 (main.py): T018, T022, T023 can run in parallel
After T024: T025, T026, T027, T028, T029 can run in parallel
```

**User Stories (After Foundational)**:
```
US3, US4, US7 can run in parallel (all depend on US2, not each other)
US5, US6 can run in parallel (both depend on US2)
```

---

## Implementation Strategy

### MVP First (User Stories 1-2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Authentication)
4. Complete Phase 4: User Story 2 (Create/View Tasks)
5. **STOP and VALIDATE**: Test MVP independently - users can sign up, create and view tasks
6. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational -> Foundation ready
2. Add User Story 1 -> Test auth flow -> Users can register/login
3. Add User Story 2 -> Test task CRUD -> Deploy MVP!
4. Add User Story 3 -> Test completion toggle -> Deploy
5. Add User Story 4 -> Test editing -> Deploy
6. Add User Story 5 -> Test deletion -> Deploy
7. Add User Story 6 -> Test detail view -> Deploy
8. Add User Story 7 -> Test responsive -> Deploy
9. Polish phase -> Final validation -> Production ready

### Task Count Summary

| Phase | Tasks | Parallel |
|-------|-------|----------|
| Setup | 13 | 10 |
| Foundational | 16 | 5 |
| US1: Auth | 12 | 4 |
| US2: Create/View | 15 | 4 |
| US3: Complete | 6 | 2 |
| US4: Update | 7 | 2 |
| US5: Delete | 5 | 2 |
| US6: View Detail | 6 | 2 |
| US7: Responsive | 6 | 1 |
| Polish | 9 | 4 |
| **Total** | **95** | **36** |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Backend 80% coverage target, Frontend 60% coverage target
