# Agent Roles

Last updated: 2026-06-12

## Orchestrator core responsibilities
The Orchestrator agent must:
1. inspect current code and docs state before coding,
2. define small, safe, reviewable tasks,
3. dispatch tasks to specialist agents,
4. enforce verification and documentation updates,
5. maintain roadmap, backlog, decisions, and progress logs.

## Product Manager Agent
Mission: Convert goals into explicit requirements and acceptance criteria.
Inputs: Business objective, current state, open risks.
Outputs: Requirement notes, acceptance checks, scope boundaries.
Done when: Every planned task has measurable acceptance criteria.

## System Architect Agent
Mission: Protect architecture consistency and define integration boundaries.
Inputs: Current module map, dependency graph, feature requirements.
Outputs: Architecture notes, boundary decisions, refactor recommendations.
Done when: Proposed changes align with existing structure or include explicit migration rationale.

## Database Agent
Mission: Own schema quality, migration safety, and seed integrity.
Inputs: Drizzle schema, migrations, seeds, data rules.
Outputs: DB impact notes, migration plan, index and constraint recommendations.
Done when: DB changes are safe, reversible (where practical), and fully documented.

## Backend Agent
Mission: Implement server actions, APIs, validation, and authorization logic.
Inputs: Roadmap task, DB model, auth rules.
Outputs: Backend code changes, validation coverage, audit instrumentation.
Done when: Server behavior is deterministic, auth-guarded, and verified.

## Frontend Agent
Mission: Implement App Router pages, forms, and state handling.
Inputs: UX spec, backend contract, route ownership map.
Outputs: UI code, form wiring, loading/error/empty states.
Done when: Route is usable, consistent, and integrated with backend contract.

## UI/UX Agent
Mission: Validate usability and interface consistency.
Inputs: Built UI routes/components.
Outputs: UX findings, consistency fixes, responsive improvements.
Done when: No major interaction or accessibility blockers remain.

## QA Agent
Mission: Define and execute verification scenarios and edge-case checks.
Inputs: Changed features and acceptance criteria.
Outputs: Test scenarios, bug reports, pass/fail results.
Done when: Critical scenarios pass and known failures are documented.

## DevOps Agent
Mission: Improve operational readiness and release safety.
Inputs: Scripts, env usage, deployment setup, observability needs.
Outputs: CI/CD proposals, deployment checklists, env documentation.
Done when: Build/deploy process is repeatable and risks are tracked.

## Documentation Agent
Mission: Keep implementation and decision records current.
Inputs: Completed tasks, design decisions, verification outcomes.
Outputs: Updated docs, change summaries, phase reports.
Done when: Docs reflect actual code and verification status.

## Security Agent
Mission: Enforce auth, authorization, data-protection, and abuse-prevention controls.
Inputs: Auth flow, endpoints, sensitive actions.
Outputs: Security findings, mitigation tasks, guardrail updates.
Done when: No unresolved high-severity security gap exists for delivered scope.

## Dispatch policy
- Tasks must be small and independently reviewable.
- Avoid parallel edits in the same files by multiple agents.
- Every task must include affected files, risks, and verification commands.
- Any DB change task must include migration impact notes.

## Task handoff contract
Required fields for every dispatched task:
- Task ID
- Objective
- Scope
- Non-goals
- Affected files
- DB impact
- Validation steps
- Definition of done
- Rollback note