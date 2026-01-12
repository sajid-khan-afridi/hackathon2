---
id: 0007
title: Create Neon Database Skill
stage: misc
date: 2025-12-29
surface: agent
model: claude-opus-4-5-20251101
feature: 002-todo-fullstack-webapp
branch: 002-todo-fullstack-webapp
user: developer
command: create skill
labels: ["skill", "database", "neon", "sqlmodel", "postgresql"]
links:
  spec: specs/002-todo-fullstack-webapp/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - .claude/skills/neon-database/SKILL.md
  - .claude/skills/neon-database/references/connection.md
  - .claude/skills/neon-database/references/sqlmodel.md
  - .claude/skills/neon-database/references/migrations.md
  - .claude/skills/neon-database/references/testing.md
tests:
  - null
---

## Prompt

create skill for"""---
name: neon-database
description: "Neon Serverless PostgreSQL database skill for Todo Full-Stack application. Use when: (1) Setting up database connections with SQLModel, (2) Creating database schemas and migrations, (3) Configuring connection pooling, (4) Writing efficient queries with user data isolation, (5) Managing database sessions in FastAPI, (6) Setting up test databases with SQLite. Covers Neon PostgreSQL, SQLModel, connection pooling, and migration patterns."
--- """

## Response snapshot

Created comprehensive Neon database skill with:

**Main skill file** (`SKILL.md`):
- Quick reference table for common patterns
- Connection setup with pooled/direct endpoints
- Configuration module with pydantic-settings
- Database connection module with async engine
- SQLModel integration patterns (base models, schemas)
- User data isolation patterns (CRITICAL: filter by user_id)
- FastAPI route integration with dependency injection
- Test database setup using SQLite for fast unit tests
- Dependencies listing for pyproject.toml

**Reference documents**:
1. `references/connection.md` - Deep dive into Neon endpoints (pooled vs direct), engine configuration, connection lifecycle, cold start handling, SSL/TLS, troubleshooting
2. `references/sqlmodel.md` - Advanced patterns: mixins, inheritance, validation, bulk operations, serialization, type safety
3. `references/migrations.md` - Alembic setup for async, migration patterns, Neon-specific considerations, zero-downtime migrations, CI/CD integration
4. `references/testing.md` - Complete testing strategy with SQLite, fixtures, model/service/API tests, user isolation tests

## Outcome

- ✅ Impact: Added database skill that provides comprehensive guidance for Phase II database layer implementation
- 🧪 Tests: Skill includes testing reference with complete test patterns
- 📁 Files: 5 files created in `.claude/skills/neon-database/`
- 🔁 Next prompts: `/sp.implement` to start Phase II backend implementation
- 🧠 Reflection: Skill follows established pattern from fastapi-backend skill, covers all aspects needed for Neon PostgreSQL integration

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): N/A - skill creation
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): N/A
