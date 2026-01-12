---
id: 0006
title: Create Next.js Frontend Skill
stage: misc
date: 2025-12-29
surface: agent
model: claude-opus-4-5-20251101
feature: 002-todo-fullstack-webapp
branch: 002-todo-fullstack-webapp
user: sajid
command: create skill
labels: ["skill", "nextjs", "frontend", "typescript", "tailwind"]
links:
  spec: specs/002-todo-fullstack-webapp/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - .claude/skills/nextjs-frontend/SKILL.md
  - .claude/skills/nextjs-frontend/references/patterns.md
  - .claude/skills/nextjs-frontend/references/testing.md
  - .claude/skills/nextjs-frontend.skill
tests:
  - Skill validated by package_skill.py
---

## Prompt

create skill for """---
name: nextjs-frontend
description: "Next.js 16+ frontend development skill for Todo Full-Stack application. Use when: (1) Creating App Router pages and layouts, (2) Building React components with TypeScript, (3) Implementing Tailwind CSS responsive styling, (4) Creating API route proxies to backend, (5) Managing authentication state with Better Auth, (6) Building forms with validation, (7) Implementing loading and error states, (8) Writing Jest and React Testing Library tests. Covers Next.js App Router, TypeScript, Tailwind CSS, and React patterns."
--- """

## Response snapshot

Created a comprehensive Next.js frontend skill following the skill-creator guidelines:

**SKILL.md contents:**
- Quick reference table for common patterns
- Project structure recommendation
- Pages and layouts with metadata examples
- Server and client component patterns
- Forms with useActionState and Zod validation
- API route proxy implementation
- Loading skeletons and error boundaries
- Better Auth integration (client setup, API route, protected components)
- Tailwind CSS responsive and dark mode patterns
- Component and API route testing examples

**Reference files:**
- `references/patterns.md`: Advanced patterns including optimistic updates, infinite scroll, real-time SSE updates, parallel data fetching, URL state management, debounced search, and modal parallel routes
- `references/testing.md`: Comprehensive testing guide with Jest setup, component testing, mocking patterns (navigation, auth, fetch), API route testing, server action testing, hooks testing, and test utilities

## Outcome

- ✅ Impact: Created reusable skill for Phase II frontend implementation
- 🧪 Tests: Skill validated and packaged successfully
- 📁 Files: 4 files created (SKILL.md, 2 references, .skill package)
- 🔁 Next prompts: Create fastapi-backend skill, implement Phase II frontend
- 🧠 Reflection: Used skill-creator skill to follow best practices for skill structure

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): package_skill.py validation PASS
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Add more specific Better Auth patterns once Phase II implementation begins
