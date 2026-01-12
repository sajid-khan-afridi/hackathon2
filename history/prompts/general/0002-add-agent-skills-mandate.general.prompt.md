---
id: 0002
title: Add Agent Skills Mandate for Implementation
stage: general
date: 2025-12-29
surface: agent
model: claude-opus-4-5-20251101
feature: none
branch: 002-todo-fullstack-webapp
user: user
command: direct request
labels: ["claude-md", "agent-skills", "implementation", "enforcement"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - CLAUDE.md
tests:
  - none
---

## Prompt

Update CLAUDE.md to enforce that whenever /sp.implement is run, Claude must first identify and apply the relevant Agent Skills or skill for the current feature/phase before making any code changes.

## Response snapshot

Added new **Section 6: Agent Skills Mandate for Implementation** to CLAUDE.md. The section enforces a blocking requirement that when `/sp.implement` is invoked, Claude must:

1. **Skill Discovery** - Review skills from TWO sources: Skill tool AND `.claude/skills/*`
2. **Relevance Analysis** - Match skills to current tech stack/file types/capabilities needed
3. **Skill Application** - Invoke relevant skills and apply their patterns before coding
4. **Documentation** - Note which skills were used and why in implementation output

Includes a skill matching table for common contexts (web UI, docs, spreadsheets, MCP servers, etc.) and explicit failure handling when no skills apply.

## Outcome

- Impact: Ensures Agent Skills knowledge is leveraged before implementation, improving code quality
- Tests: none
- Files: 1 modified (CLAUDE.md)
- Next prompts: Test /sp.implement to verify skill discovery happens first
- Reflection: This enforcement aligns with the project's emphasis on using specialized tools over internal knowledge

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): N/A
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): Monitor /sp.implement runs to verify compliance
