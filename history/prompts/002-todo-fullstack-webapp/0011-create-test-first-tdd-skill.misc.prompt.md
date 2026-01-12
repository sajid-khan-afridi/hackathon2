---
id: "0011"
title: Create Test-First TDD Skill
stage: misc
date: 2024-12-30
surface: agent
model: claude-opus-4-5-20251101
feature: 002-todo-fullstack-webapp
branch: 002-todo-fullstack-webapp
user: sajid
command: create skill
labels: ["skill", "tdd", "testing", "pytest", "jest"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - .claude/skills/test-first/SKILL.md
  - .claude/skills/test-first/references/pytest-patterns.md
  - .claude/skills/test-first/references/jest-patterns.md
tests:
  - null
---

## Prompt

create skill for """name: test-first
description: "Test-First Development (TDD) skill for Todo Full-Stack application. Use when: (1) Writing acceptance tests from spec scenarios, (2) Implementing Red-Green-Refactor cycle, (3) Creating pytest fixtures and test files, (4) Writing Jest and React Testing Library tests, (5) Achieving coverage targets (80% backend, 60% frontend), (6) Testing API contracts, (7) Mocking authentication in tests. This principle is NON-NEGOTIABLE. Tests MUST be written before implementation.""""

## Response snapshot

Created the test-first skill with comprehensive TDD guidance for the Todo Full-Stack application:

**SKILL.md** - Core TDD workflow:
- NON-NEGOTIABLE principle: Tests MUST be written BEFORE implementation
- Red-Green-Refactor cycle enforcement
- Coverage targets: 80% backend, 60% frontend
- Spec-to-test conversion workflow
- Anti-patterns to avoid
- Enforcement checklist

**references/pytest-patterns.md** - Backend testing:
- Pytest fixtures for FastAPI TestClient
- Async test patterns with pytest-asyncio
- Database test isolation with per-test reset
- Auth token fixtures and multi-user testing
- CRUD test patterns (Create, Read, Update, Delete)
- Error path testing

**references/jest-patterns.md** - Frontend testing:
- Jest configuration for Next.js
- React Testing Library setup with custom render
- Component testing patterns
- Hook testing with renderHook
- API mocking with MSW (Mock Service Worker)
- Auth context mocking patterns

## Outcome

- Impact: Created comprehensive TDD skill to enforce test-first development across backend and frontend
- Tests: Skill provides patterns for pytest and Jest testing
- Files: 3 files created in .claude/skills/test-first/
- Next prompts: Apply skill during implementation phases
- Reflection: Skill follows progressive disclosure pattern with core workflow in SKILL.md and detailed patterns in reference files

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): N/A
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Test skill application during next implementation task
