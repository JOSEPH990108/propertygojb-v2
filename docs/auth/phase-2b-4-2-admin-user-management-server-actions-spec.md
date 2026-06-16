# Phase 2B.4.2 Admin User Management Server Action / API Design Specification

Date: 2026-06-02
Phase: 2B.4.2
Scope: Documentation/specification only
Status: Draft for approval before implementation

References:
- docs/auth/phase-2b-4-admin-internal-user-management-ui-spec.md
- docs/auth/phase-2b-4-1-admin-user-management-authority-decision.md
- docs/auth/phase-2b-internal-user-provisioning-spec.md
- docs/auth/phase-2a-auth-access-integration-closure-report.md
- docs/database/reports/2026-05-29-phase-1d-verification-report.md
- src/db/schema/identity-auth.ts
- src/db/schema/audit.ts
- src/db/schema/governance-rbac.ts
- src/lib/auth/guards.ts
- src/config/routes.ts
- src/config/roles.ts
- package.json

## 1) Objective
Define server-side actions/API design for admin internal user management.

This specification covers:
- user listing design
- user detail fetch design
- role assignment design
- audit write design for successful role changes

This document is design-only. No runtime implementation is included.

## 2) Current status
Confirmed baseline:
- admin route guard exists and protects /admin access.
- admin user-management UI is not implemented yet.
- authority rules are locked in Phase 2B.4.1.
- audit schema exists (audit_logs available).
- permission-level RBAC resolver is not implemented yet.

## 3) Server action approach
Recommended approach:
- use server actions or server-only functions first.
- do not introduce public role-management API endpoints for MVP.

Expected future module location:
- src/lib/admin/users/actions.ts
- or src/server/admin/users.ts

Required server-side actions:
- listAdminUsers
- getAdminUserById
- assignInternalUserRole
- optional: getAssignableRolesForActor

Explicitly deferred actions:
- disableUser
- reactivateUser
- invite user
- production invitation flow

## 4) listAdminUsers design
Purpose:
- list internal users for admin management screens with safe searchable/filterable access.

Authority:
- actor must be authenticated.
- actor role must resolve from DB.
- actor role must be ADMIN or SUPER_ADMIN.

Query/filter behavior:
- searchable fields:
  - name
  - email
  - phone number
  - role
- support pagination (page + pageSize or cursor + limit).
- support role filter.
- support created date sorting (default newest first).

Safe returned fields only:
- id
- name
- email
- phoneMasked (preferred) or phoneNumber if internally acceptable
- roleCode
- createdAt
- updatedAt

Do not return:
- session tokens
- account provider secrets (accessToken/refreshToken/idToken)
- password fields or equivalent secret data
- unnecessary sensitive metadata

## 5) getAdminUserById design
Purpose:
- return one user profile record for admin detail view/edit preparation.

Authority:
- actor must be authenticated.
- actor role resolved from DB must be ADMIN or SUPER_ADMIN.

Response shape:
- safe profile fields
- canonical role info (role id and role code as needed)
- optional placeholders for future audit/history read integration

Future extension note:
- role history can be included later when an audit/history view is implemented.

Do not return:
- tokens, secrets, or hidden auth-provider credentials.

## 6) assignInternalUserRole design
Purpose:
- update user role using locked authority policy, then write audit log on success.

Input:
- targetUserId
- targetRole
- reasonNote

Validation and policy enforcement:
- actor must be authenticated.
- actor role must be resolved from DB.
- target user must exist.
- target role must be one of:
  - CUSTOMER
  - AGENT
  - ADMIN
- targetRole SUPER_ADMIN must be blocked in MVP.
- reasonNote is required and must be non-empty after trim.
- actor cannot modify own role.

ADMIN enforcement:
- ADMIN can assign AGENT.
- ADMIN can change AGENT to CUSTOMER only for operational correction.
- ADMIN cannot assign ADMIN.
- ADMIN cannot assign SUPER_ADMIN.
- ADMIN cannot modify SUPER_ADMIN users.

SUPER_ADMIN enforcement:
- SUPER_ADMIN can assign CUSTOMER, AGENT, ADMIN.
- SUPER_ADMIN cannot assign SUPER_ADMIN in MVP.

Processing notes:
- resolve current target role from DB before evaluating transition.
- evaluate transition legality against actor role and locked matrix.
- write role update only if transition is allowed.
- write audit log only after successful role update.

## 7) Authority matrix enforcement
Server action must enforce authority matrix from Phase 2B.4.1, not just UI.

| Actor role | Target action | Decision |
|---|---|---|
| ADMIN | assign CUSTOMER | allowed (operational correction path only) |
| ADMIN | assign AGENT | allowed |
| ADMIN | assign ADMIN | denied |
| ADMIN | assign SUPER_ADMIN | denied |
| ADMIN | modify SUPER_ADMIN | denied |
| ADMIN | modify own role | denied |
| SUPER_ADMIN | assign CUSTOMER | allowed |
| SUPER_ADMIN | assign AGENT | allowed |
| SUPER_ADMIN | assign ADMIN | allowed |
| SUPER_ADMIN | assign SUPER_ADMIN | future approval required |
| SUPER_ADMIN | modify SUPER_ADMIN | future approval required |
| SUPER_ADMIN | modify own role | denied |

Enforcement requirement:
- UI visibility rules are convenience only.
- server-side checks are the source of truth for authorization.

## 8) Audit design
On successful role change, write to audit_logs.

Required audit events:
- INTERNAL_USER_ROLE_ASSIGNED
- INTERNAL_USER_ROLE_CHANGED

Minimum audit payload intent:
- actorUserId
- targetUserId
- previousRole
- newRole
- reasonNote
- sourceApp = ADMIN_PORTAL
- entityType = USER
- entityId = targetUserId
- actionType = INTERNAL_USER_ROLE_CHANGED (or INTERNAL_USER_ROLE_ASSIGNED when first internal assignment convention is preferred)
- requestId/traceId if available
- beforeJson/afterJson if schema supports it

Schema mapping based on current audit table (src/db/schema/audit.ts):
- actorUserId -> audit_logs.actor_user_id
- actorRoleId -> audit_logs.actor_role_id (optional when available)
- actionType -> audit_logs.action_type
- entityType -> audit_logs.entity_type
- entityId -> audit_logs.entity_id
- requestId -> audit_logs.request_id
- traceId -> audit_logs.trace_id
- beforeJson -> audit_logs.before_json
- afterJson -> audit_logs.after_json
- sourceApp -> audit_logs.source_app
- metadata -> audit_logs.metadata (store reasonNote and extra context)
- createdAt -> audit_logs.created_at

Suggested write convention:
- use actionType INTERNAL_USER_ROLE_ASSIGNED when previous role is CUSTOMER and new role is AGENT/ADMIN internal assignment.
- use actionType INTERNAL_USER_ROLE_CHANGED for all other approved role transitions.

## 9) Error handling
Return safe error outcomes only.

Defined error cases:
- unauthenticated
- forbidden
- invalid role
- target user not found
- reason note required
- self-role modification blocked
- SUPER_ADMIN assignment blocked in MVP

Response safety rules:
- do not expose internal SQL details.
- do not expose stack traces.
- do not leak secret fields in errors.
- return user-safe messages suitable for admin UI display.

## 10) UI integration expectations
Future UI integration contract:
- UI calls server actions only for list/detail/role changes.
- do not call public role-management endpoints.

RoleChangeDialog expectations:
- reason note is required before submit.
- show only allowed target role options for actor.
- rely on server-side enforcement as final authority.
- refresh users list after successful role change.

## 11) Security requirements
Locked security requirements for this phase:
- no public role promotion endpoint
- no client-trusted role assignment
- no secrets/tokens returned in list/detail responses
- no DB schema changes
- no middleware
- no permission resolver dependency yet
- no SUPER_ADMIN assignment in MVP
- no self-role modification

## 12) Test checklist
Planned verification checklist for implementation phase:
- ADMIN lists users
- AGENT cannot list users
- CUSTOMER cannot list users
- ADMIN assigns AGENT
- ADMIN changes AGENT to CUSTOMER with reason
- ADMIN cannot assign ADMIN
- ADMIN cannot assign SUPER_ADMIN
- ADMIN cannot modify own role
- ADMIN cannot modify SUPER_ADMIN user
- SUPER_ADMIN assigns ADMIN
- SUPER_ADMIN cannot assign SUPER_ADMIN in MVP
- missing reason note fails
- audit log written on successful role change
- public auth remains CUSTOMER-only

## 13) Exclusions
Out of scope for this phase:
- no implementation yet
- no UI yet
- no DB migration
- no public API endpoint
- no disable/reactivate implementation
- no invitation workflow
- no permission resolver
- no middleware
- no SUPER_ADMIN assignment UI

## 14) Final recommendation
Phase 2B.4.3 users list page planning/implementation can proceed after this 2B.4.2 specification is approved.

Proceeding conditions:
- keep server-side matrix enforcement mandatory
- keep reasonNote mandatory for role changes
- keep SUPER_ADMIN assignment blocked in MVP
- keep role management server-only (no public promotion endpoint)
