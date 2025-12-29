# Tasks: Todo In-Memory Console App

**Input**: Design documents from `/specs/001-todo-console-app/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Tests**: Included - constitution requires pytest with 80% coverage target.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project (Phase I)**: `phase1/src/`, `phase1/tests/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create phase1 directory structure per plan.md (phase1/src/, phase1/tests/)
- [X] T002 Create pyproject.toml with UV config, pytest, mypy, black, ruff dependencies
- [X] T003 [P] Create phase1/src/__init__.py package marker
- [X] T004 [P] Create phase1/tests/__init__.py package marker
- [X] T005 [P] Create phase1/README.md with quickstart instructions
- [X] T006 [P] Create phase1/CLAUDE.md with AI agent instructions for Phase I

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T007 Create Task dataclass in phase1/src/models.py per data-model.md
- [X] T008 Create custom exceptions (TodoError, TaskNotFoundError, ValidationError) in phase1/src/models.py
- [X] T009 Create TaskStorage class skeleton in phase1/src/storage.py per data-model.md
- [X] T010 [P] Write unit tests for Task model in phase1/tests/test_models.py
- [X] T011 [P] Write unit tests for custom exceptions in phase1/tests/test_models.py
- [X] T012 Implement TaskStorage.add() method in phase1/src/storage.py
- [X] T013 Implement TaskStorage.get() method in phase1/src/storage.py
- [X] T014 Implement TaskStorage.get_all() method in phase1/src/storage.py
- [X] T015 Implement TaskStorage.update() method in phase1/src/storage.py
- [X] T016 Implement TaskStorage.delete() method in phase1/src/storage.py
- [X] T017 Write unit tests for TaskStorage in phase1/tests/test_storage.py
- [X] T018 Create CLI menu skeleton in phase1/src/main.py (FR-009)
- [X] T019 Implement graceful exit in phase1/src/main.py (FR-011)

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Add New Todo Task (Priority: P1) 🎯 MVP

**Goal**: Users can add new tasks with text descriptions to track what needs to be accomplished

**Independent Test**: Launch app → Select "add task" → Enter "Buy groceries" → Verify task appears in list with unique ID

**Acceptance Criteria (from spec.md)**:
- New task created with description and marked as incomplete
- Empty description rejected with error message
- New task appended with unique identifier

### Tests for User Story 1

> **NOTE: Write tests FIRST, ensure they FAIL before implementation**

- [X] T020 [P] [US1] Write test for add_task() success case in phase1/tests/test_operations.py
- [X] T021 [P] [US1] Write test for add_task() with empty description in phase1/tests/test_operations.py
- [X] T022 [P] [US1] Write test for add_task() with description >500 chars in phase1/tests/test_operations.py (FR-012)

### Implementation for User Story 1

- [X] T023 [US1] Create operations.py skeleton in phase1/src/operations.py
- [X] T024 [US1] Implement add_task() function in phase1/src/operations.py (FR-001, FR-002, FR-007, FR-012)
- [X] T025 [US1] Implement validation for task description (non-empty, max 500 chars) in phase1/src/operations.py
- [X] T026 [US1] Add "Add Task" menu option handler in phase1/src/main.py
- [X] T027 [US1] Implement user input prompts for task description in phase1/src/main.py
- [X] T028 [US1] Display success message with assigned task ID in phase1/src/main.py

**Checkpoint**: User Story 1 complete - users can add tasks

---

## Phase 4: User Story 2 - View All Tasks (Priority: P1) 🎯 MVP

**Goal**: Users can view all tasks with ID, description, and completion status

**Independent Test**: Add several tasks → Select "view tasks" → Verify all tasks displayed with status indicators

**Acceptance Criteria (from spec.md)**:
- All tasks displayed with ID, description, and completion status
- Empty list shows friendly message
- Complete and incomplete tasks clearly distinguishable

### Tests for User Story 2

- [X] T029 [P] [US2] Write test for view_tasks() with tasks in phase1/tests/test_operations.py
- [X] T030 [P] [US2] Write test for view_tasks() with empty list in phase1/tests/test_operations.py
- [X] T031 [P] [US2] Write test for view_tasks() with mixed statuses in phase1/tests/test_operations.py

### Implementation for User Story 2

- [X] T032 [US2] Implement view_tasks() function in phase1/src/operations.py (FR-003)
- [X] T033 [US2] Implement task display format per data-model.md (ID, Status, Description columns)
- [X] T034 [US2] Add "View Tasks" menu option handler in phase1/src/main.py
- [X] T035 [US2] Display formatted task list or empty message in phase1/src/main.py

**Checkpoint**: User Stories 1 AND 2 complete - users can add and view tasks (MVP!)

---

## Phase 5: User Story 3 - Mark Task Complete (Priority: P2)

**Goal**: Users can mark tasks as complete to track progress

**Independent Test**: Add task → Mark complete by ID → Verify status change in view

**Acceptance Criteria (from spec.md)**:
- Task status changes to complete and reflected in view
- Already complete task acknowledged (no error)
- Invalid task ID shows error message

### Tests for User Story 3

- [X] T036 [P] [US3] Write test for mark_complete() success in phase1/tests/test_operations.py
- [X] T037 [P] [US3] Write test for mark_complete() already complete in phase1/tests/test_operations.py
- [X] T038 [P] [US3] Write test for mark_complete() invalid ID in phase1/tests/test_operations.py (FR-013)

### Implementation for User Story 3

- [X] T039 [US3] Implement mark_complete() function in phase1/src/operations.py (FR-004)
- [X] T040 [US3] Implement task ID validation (positive integer only) in phase1/src/operations.py (FR-013)
- [X] T041 [US3] Add "Mark Complete" menu option handler in phase1/src/main.py
- [X] T042 [US3] Implement task ID input prompt with validation in phase1/src/main.py
- [X] T043 [US3] Display success/error messages for mark complete in phase1/src/main.py (FR-008)

**Checkpoint**: User Story 3 complete - users can track progress

---

## Phase 6: User Story 4 - Update Task Description (Priority: P3)

**Goal**: Users can update task descriptions without deleting and recreating

**Independent Test**: Add task → Update description → Verify change persists in view

**Acceptance Criteria (from spec.md)**:
- Task description changes, completion status preserved
- Invalid task ID shows error message
- Empty description rejected, original retained

### Tests for User Story 4

- [X] T044 [P] [US4] Write test for update_task() success in phase1/tests/test_operations.py
- [X] T045 [P] [US4] Write test for update_task() invalid ID in phase1/tests/test_operations.py
- [X] T046 [P] [US4] Write test for update_task() empty description in phase1/tests/test_operations.py
- [X] T047 [P] [US4] Write test for update_task() preserves completion status in phase1/tests/test_operations.py

### Implementation for User Story 4

- [X] T048 [US4] Implement update_task() function in phase1/src/operations.py (FR-005)
- [X] T049 [US4] Add "Update Task" menu option handler in phase1/src/main.py
- [X] T050 [US4] Implement task ID and new description input prompts in phase1/src/main.py
- [X] T051 [US4] Display success/error messages for update in phase1/src/main.py (FR-008)

**Checkpoint**: User Story 4 complete - users can refine tasks

---

## Phase 7: User Story 5 - Delete Task (Priority: P3)

**Goal**: Users can delete tasks to remove irrelevant items

**Independent Test**: Add task → Delete by ID → Verify task no longer in list

**Acceptance Criteria (from spec.md)**:
- Task removed and no longer appears in list
- Invalid task ID shows error message
- Remaining tasks retain original IDs (no re-numbering)

### Tests for User Story 5

- [X] T052 [P] [US5] Write test for delete_task() success in phase1/tests/test_operations.py
- [X] T053 [P] [US5] Write test for delete_task() invalid ID in phase1/tests/test_operations.py
- [X] T054 [P] [US5] Write test for delete_task() ID not reused in phase1/tests/test_operations.py

### Implementation for User Story 5

- [X] T055 [US5] Implement delete_task() function in phase1/src/operations.py (FR-006)
- [X] T056 [US5] Add "Delete Task" menu option handler in phase1/src/main.py
- [X] T057 [US5] Implement task ID input prompt for delete in phase1/src/main.py
- [X] T058 [US5] Display success/error messages for delete in phase1/src/main.py (FR-008)

**Checkpoint**: All user stories complete - full CRUD functionality

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Quality assurance and final validation

- [X] T059 Run pytest with coverage and ensure 80% threshold met
- [X] T060 [P] Run black formatter on phase1/src and phase1/tests
- [X] T061 [P] Run ruff linter and fix any issues
- [X] T062 [P] Run mypy type checker and fix any issues
- [X] T063 Validate all success criteria (SC-001 to SC-006) from spec.md
- [X] T064 Run quickstart.md validation (setup, run, test commands work)
- [X] T065 Final code review and cleanup

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-7)**: All depend on Foundational phase completion
  - US1 and US2 (both P1) can proceed in parallel
  - US3 (P2) can start after Foundational, but logically follows US1
  - US4 and US5 (both P3) can proceed in parallel
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

| Story | Priority | Depends On | Can Start After |
|-------|----------|------------|-----------------|
| US1 (Add) | P1 | Foundational | Phase 2 |
| US2 (View) | P1 | Foundational | Phase 2 |
| US3 (Complete) | P2 | Foundational, US1 (logical) | Phase 2 |
| US4 (Update) | P3 | Foundational | Phase 2 |
| US5 (Delete) | P3 | Foundational | Phase 2 |

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Implementation follows test-first pattern
- Story complete before moving to next priority

### Parallel Opportunities

- T003, T004, T005, T006: All Setup file creations can run in parallel
- T010, T011: Model tests can run in parallel
- T020, T021, T022: US1 tests can run in parallel
- T029, T030, T031: US2 tests can run in parallel
- T036, T037, T038: US3 tests can run in parallel
- T044, T045, T046, T047: US4 tests can run in parallel
- T052, T053, T054: US5 tests can run in parallel
- T060, T061, T062: Code quality checks can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Write test for add_task() success case in phase1/tests/test_operations.py"
Task: "Write test for add_task() with empty description in phase1/tests/test_operations.py"
Task: "Write test for add_task() with description >500 chars in phase1/tests/test_operations.py"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Add)
4. Complete Phase 4: User Story 2 (View)
5. **STOP and VALIDATE**: Test Add + View independently
6. Users can now capture and view todos - basic value delivered!

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add US1 + US2 → Test → Demo (MVP!)
3. Add US3 (Mark Complete) → Test → Demo
4. Add US4 + US5 → Test → Demo (Full CRUD)
5. Polish phase → Final validation

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Add) + User Story 2 (View)
   - Developer B: User Story 3 (Mark Complete)
   - Developer C: User Story 4 (Update) + User Story 5 (Delete)
3. Stories complete and integrate independently

---

## Summary

| Metric | Count |
|--------|-------|
| **Total Tasks** | 65 |
| **Setup Phase** | 6 |
| **Foundational Phase** | 13 |
| **User Story 1 (Add)** | 9 |
| **User Story 2 (View)** | 7 |
| **User Story 3 (Complete)** | 8 |
| **User Story 4 (Update)** | 8 |
| **User Story 5 (Delete)** | 7 |
| **Polish Phase** | 7 |
| **Parallelizable Tasks** | 26 |

**MVP Scope**: User Stories 1 + 2 (Add + View) = 16 tasks after Setup + Foundational

**Format Validation**: ✅ All tasks follow checklist format (checkbox, ID, labels, file paths)
