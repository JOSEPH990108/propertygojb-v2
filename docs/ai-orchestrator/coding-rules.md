# Coding Rules

Last updated: 2026-06-12
Owner: System Architect Agent

## Core implementation rules
1. Analyze existing implementation before creating new code.
2. Preserve existing route groups and architecture unless justified.
3. Keep changes small, reviewable, and reversible when practical.
4. Prefer extending existing patterns over introducing new patterns.

## Authorization and security rules
1. Authorization must be enforced server-side.
2. Navigation visibility is never a permission control.
3. Sensitive actions must include audit logging.
4. Do not expose secrets or sensitive internals in logs or responses.

## Data and database rules
1. No schema change without migration impact analysis.
2. Migrations must be reviewed for data integrity and index coverage.
3. Seed ordering must remain deterministic and dependency-safe.
4. Avoid destructive data operations unless explicitly approved.

## Backend rules
1. Validate all external inputs.
2. Return safe and consistent failure responses.
3. Use transactions for multi-step writes where consistency matters.
4. Keep domain logic in server helpers, not scattered across route handlers.

## Frontend rules
1. Respect existing layout ownership and route responsibilities.
2. Include loading, empty, and error states for data-driven UI.
3. Keep placeholder routes explicit until real wiring exists.
4. Prefer reusable components over duplicated UI logic.

## Documentation rules
1. Update docs for every meaningful change.
2. Record architecture or policy changes in decision-log.md.
3. Record phase completion and checks in progress-log.md.
4. Keep project-state.md and system-map.md aligned with actual code.

## Verification rules
1. Run standard checks from verification-checklist.md for every phase.
2. Document unresolved issues and deferred work explicitly.
3. Do not mark a task done without evidence of checks.