# Phase 2D.6 Project Audit Logging Notes

Date: 2026-06-05
Phase: 2D.6
Scope: Project create and update audit logging only
Status: Implementation notes

## Preflight schema confirmation
Inspected `src/db/schema/audit.ts`.

Confirmed `audit_logs` write shape supports this phase:
- `actionType`: `varchar(40)`
- `entityType`: `varchar(60)`
- `entityId`: `text`
- `beforeJson` / `afterJson`: `jsonb`
- `sourceApp`: `varchar(30)`
- `metadata`: `jsonb`

Action type fit check (`varchar(40)`):
- `PROJECT_CREATED`
- `PROJECT_UPDATED`
- `PROJECT_PUBLISHED`
- `PROJECT_UNPUBLISHED`

All values fit within 40 chars, so no fallback mapping is required.

## Implemented files
- `src/lib/admin/projects/audit.ts`
- `src/lib/admin/projects/actions.ts`

## Audit action mapping used
- Create success: `PROJECT_CREATED`
- Update success with publish transition `false -> true`: `PROJECT_PUBLISHED`
- Update success with publish transition `true -> false`: `PROJECT_UNPUBLISHED`
- Update success without publish transition: `PROJECT_UPDATED`

## Transaction behavior
Mutation and audit writes are executed in the same DB transaction for both flows:
- `createAdminProject`: insert project + audit insert in one transaction
- `updateAdminProject`: fetch existing + update project + audit insert in one transaction

If audit insert fails, transaction fails closed and returns safe mutation failure:
- create path returns `CREATE_FAILED`
- update path returns `UPDATE_FAILED`

## Audit payload contents
Project audit writes include:
- `actorUserId`
- `actorRoleId` when available
- `entityType = PROJECT`
- `entityId = projectId`
- `actionType` based on mapping rules
- `beforeJson` (for update)
- `afterJson`
- `sourceApp = ADMIN_PORTAL`
- `metadata.eventType`
- `metadata.changedFields`
- previous/new name, slug, and isPublished flags in metadata

## Security and scope notes
- Actor identity is resolved from `requireRole(["ADMIN", "SUPER_ADMIN"])` auth context.
- No client-supplied actor fields are trusted.
- No public mutation or audit endpoint was introduced.
- No DB schema changes and no migrations were added.
- No UI behavior changes were required for this phase.
