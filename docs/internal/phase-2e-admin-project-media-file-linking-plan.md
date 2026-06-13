# Phase 2E Admin Project Media + File Linking Plan

Date: 2026-06-13
Phase: 2E
Scope: Planning + featured-file verification closure + next-step sequencing
Status: Completed

## 1. Objective
Deliver bounded extension on top of Phase 2D admin projects foundation:
- expose safe featured file linking in create/edit flow,
- add first project media relation management primitives,
- keep media upload and public showcase out of scope.

## 2. Scope Boundaries
In scope:
- featuredFileId selection from existing files records.
- server-side validation for file existence (already present).
- project_media attach/list/remove baseline in admin flow.
- audit-safe mutation behavior.

Out of scope:
- file upload pipeline.
- file scanning workflow changes.
- public-facing project media rendering.
- delete/archive project lifecycle.

## 3. Implementation Sequence
1. O9-T01 acceptance definition (done).
2. O9-T02 backend form option wiring for files lookup (done).
3. O9-T03 frontend featured file selector (done).
4. O9-T04 manual verification report for featured file linking (done).
5. O9-T05 backend project_media relation primitives (done).
6. O9-T06 frontend project media management UI (done).
7. O9-T07 verification + closure report (done).

## 4. Affected Files (Current + Planned)
Current implementation:
- src/lib/admin/projects/actions.ts
- src/lib/admin/projects/server-actions.ts
- src/lib/admin/projects/audit.ts
- src/components/admin/projects/project-form.tsx
- src/components/admin/projects/project-media-manager.tsx
- src/app/(internal)/admin/projects/[id]/edit/page.tsx
- docs/internal/phase-2e-admin-project-media-linking-verification-report.md
- docs/internal/phase-2e-admin-project-media-closure-verification-report.md

Planned next files:
- src/lib/admin/projects/actions.ts
- src/lib/admin/projects/server-actions.ts
- src/components/admin/projects/project-form.tsx
- src/app/(internal)/admin/projects/[id]/edit/page.tsx
- docs/internal/phase-2e-admin-project-media-linking-verification-report.md

## 5. Acceptance Criteria
- Admin create/edit form shows featured file selector with safe empty state.
- Submitting invalid featuredFileId returns validation error and blocks mutation.
- Editing keeps existing featuredFileId when unchanged.
- project_media attach/remove operations enforce ADMIN/SUPER_ADMIN server-side guards.
- All mutations remain transaction-safe and emit audit events for traceability.

## 6. Verification Plan
Required checks:
- git status --short
- npm run lint
- npx tsc --noEmit
- npm run test
- manual runtime scenarios for create/edit with/without featured file id

Manual scenarios:
- create project with no featured file (pass)
- create/edit with non-existent featured file id (validation failure)
- create/edit with valid featured file id (pass; requires seeded files row)
- clear featured file from existing project (pass)

## 7. Risks and Dependencies
- Local environment currently has zero active rows in files table; positive-path manual check depends on seeding test file records.
- Upload flow is intentionally absent, so file-linking must tolerate empty catalog state without blocking project operations.

## 8. Immediate Next Step
Phase 2E is closed. Move to next prioritized backlog phase/task after orchestration reprioritization.
