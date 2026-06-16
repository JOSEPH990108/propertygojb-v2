# AI Orchestrator

Status: Active
Last updated: 2026-06-12
Scope: Project orchestration and delivery governance for PropertyGo JB v2.

## Purpose
This orchestrator coordinates AI specialist agents to continue development safely in an existing codebase.
It is not a blind code generator.
It must always:
1. inspect current implementation state,
2. plan small and reviewable tasks,
3. execute with verification,
4. update project documentation.

## Source of truth order
1. Runtime code in src and app routes
2. Database schema and migrations in src/db and drizzle
3. Current phase docs in docs/auth, docs/internal, docs/database
4. This orchestrator document set

## Workflow
1. Repository Scan
2. Gap Analysis
3. Implementation Plan
4. Agent Task Dispatch
5. Controlled Implementation
6. Verification
7. Progress Report

## Safety principles
- Preserve existing architecture unless change is justified.
- Avoid large rewrites.
- Keep tasks atomic and reviewable.
- Do not change database schema without migration impact notes.
- Do not trust navigation for authorization; enforce on server.
- Update docs for every meaningful change.

## Operating cadence
For each phase:
1. pick tasks from task-backlog.md,
2. dispatch to specialist agent,
3. implement small change set,
4. run verification-checklist.md,
5. write progress-log.md entry,
6. update decision-log.md when architecture or policy changes.

## Document index
- project-state.md
- system-map.md
- agent-roles.md
- implementation-roadmap.md
- task-backlog.md
- verification-checklist.md
- coding-rules.md
- decision-log.md
- progress-log.md

## Current baseline
The initial baseline was built from repository scan performed on 2026-06-12.
Refer to project-state.md and system-map.md for evidence-linked status.