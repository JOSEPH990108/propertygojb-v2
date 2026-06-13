# Verification Checklist

Last updated: 2026-06-12
Owner: QA Agent

## Standard checks for every implementation step
Run in this order unless explicitly justified otherwise:
1. git status --short
2. npm run lint
3. npx tsc --noEmit
4. feature-specific check (manual scenario, build, or tests)
5. review changed files and summarize risk

## Documentation-only change checks
For docs-only phases:
1. git status --short
2. verify links and references are correct
3. ensure progress and decision logs are updated where required

## Backend change checks
1. lint and typecheck
2. validate auth guards on protected operations
3. validate input parsing and failure responses
4. confirm audit logging for sensitive actions
5. execute targeted manual or automated tests

## Frontend change checks
1. lint and typecheck
2. verify loading, empty, and error states
3. verify route guard behavior for unauthorized access
4. verify key user journey manually

## Database change checks
If schema changes:
1. update schema in src/db/schema
2. generate migration via drizzle-kit
3. review generated SQL for constraints and indexes
4. run migration in safe environment
5. run seed if required and verify seed order assumptions
6. verify runtime compatibility with changed schema
7. document migration impact and rollback notes

## Release readiness checks for a phase
1. completed tasks match phase scope
2. known issues and risks are documented
3. next task recommendation is explicit
4. docs are synchronized with implementation

## Evidence format for progress log
Every phase completion entry should include:
- summary of completed work
- list of changed files
- verification command outcomes
- unresolved risks or deferred items
- next recommended task