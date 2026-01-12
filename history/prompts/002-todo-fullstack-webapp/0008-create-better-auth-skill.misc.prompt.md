---
id: 0008
title: Create Better Auth Skill
stage: misc
date: 2025-12-29
surface: agent
model: claude-opus-4-5-20251101
feature: 002-todo-fullstack-webapp
branch: 002-todo-fullstack-webapp
user: developer
command: create skill
labels: ["skill", "authentication", "better-auth", "jwt", "security"]
links:
  spec: specs/002-todo-fullstack-webapp/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - .claude/skills/better-auth/SKILL.md
  - .claude/skills/better-auth/references/backend.md
  - .claude/skills/better-auth/references/frontend.md
  - .claude/skills/better-auth/references/flows.md
tests:
  - null
---

## Prompt

create skill for """---
name: better-auth
description: "Better Auth JWT authentication skill for Todo Full-Stack application. Use when: (1) Configuring JWT token verification in FastAPI, (2) Setting up Better Auth client in Next.js, (3) Implementing signup and signin flows, (4) Creating protected routes and layouts, (5) Managing session state in React, (6) Handling token expiration and refresh, (7) Implementing signout functionality. Covers Better Auth, JWT tokens, protected routes, and session management."
---"""

## Response snapshot

Created comprehensive Better Auth skill with:

**Main skill file** (`SKILL.md`):
- Architecture overview diagram showing token flow
- Backend JWT verification middleware for FastAPI
- Frontend Better Auth client setup for Next.js
- Protected layout and page patterns (server components)
- Auth API route handler setup
- Sign in/up/out form components
- API route proxy with auth token forwarding
- Environment variables configuration

**Reference documents**:
1. `references/backend.md` - Advanced FastAPI JWT patterns: token structure, middleware variations (required/optional auth), request context, router-level auth, testing fixtures, security best practices
2. `references/frontend.md` - Advanced Next.js patterns: full client setup, session hooks with redirect, auth context provider, protected route HOC, form handling, API client with auth, testing mocks
3. `references/flows.md` - Complete auth flows: sign up with validation and password strength, sign in with remember me and redirect, sign out with cleanup, session expiration handling, error mapping

## Outcome

- ✅ Impact: Added authentication skill providing end-to-end JWT auth patterns for Phase II
- 🧪 Tests: Includes testing patterns for both backend and frontend auth
- 📁 Files: 4 files created in `.claude/skills/better-auth/`
- 🔁 Next prompts: `/sp.implement` to start Phase II implementation
- 🧠 Reflection: Skill bridges frontend and backend auth with shared secret JWT verification, following Better Auth best practices

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): N/A - skill creation
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): N/A
