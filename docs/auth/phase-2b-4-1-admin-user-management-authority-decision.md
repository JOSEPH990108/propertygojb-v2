# Phase 2B.4.1 Admin User Management Authority Decision Lock

Date: 2026-06-02
Phase: 2B.4.1
Scope: Documentation/decision only
Status: Authority decisions locked before implementation

References:
- docs/auth/phase-2b-4-admin-internal-user-management-ui-spec.md
- docs/auth/phase-2b-internal-user-provisioning-spec.md
- docs/auth/phase-2b-2-dev-internal-test-user-provisioning-report.md
- docs/auth/phase-2b-3-agent-admin-route-guard-verification-report.md
- docs/auth/phase-2a-auth-access-integration-closure-report.md
- docs/database/reports/2026-05-29-phase-1d-verification-report.md
- src/db/schema/identity-auth.ts
- src/db/schema/governance-rbac.ts
- src/db/schema/audit.ts
- src/lib/auth/guards.ts
- src/config/roles.ts
- src/config/routes.ts
- package.json

## 1) Objective
Lock authority rules for admin internal user management before implementation.

This decision document defines:
- who can assign AGENT, ADMIN, and SUPER_ADMIN roles
- what role-management actions are allowed vs denied in MVP
- what remains excluded from MVP implementation

## 2) Current status
Confirmed current state:
- CUSTOMER public auth works.
- AGENT and ADMIN route guards are verified.
- dev-only internal provisioning exists for local testing.
- production-safe admin user management UI is not implemented yet.
- permission-level RBAC resolver is not implemented yet.

## 3) Final authority decisions
### A) ADMIN authority
Locked decisions:
- ADMIN can view internal users.
- ADMIN can assign AGENT role.
- ADMIN can change AGENT back to CUSTOMER only for approved operational correction.
- ADMIN cannot assign ADMIN role.
- ADMIN cannot assign SUPER_ADMIN role.
- ADMIN cannot modify SUPER_ADMIN users.
- ADMIN cannot modify own role.

### B) SUPER_ADMIN authority
Locked decisions:
- SUPER_ADMIN can view internal users.
- SUPER_ADMIN can assign AGENT.
- SUPER_ADMIN can assign ADMIN.
- SUPER_ADMIN assignment remains excluded from MVP UI.
- SUPER_ADMIN cannot casually create another SUPER_ADMIN in MVP.
- SUPER_ADMIN role assignment requires separate future approval flow.

### C) SUPER_ADMIN exclusion
Locked decisions:
- SUPER_ADMIN assignment UI is excluded from MVP.
- Any SUPER_ADMIN assignment remains manual/dev-only for now.
- Future SUPER_ADMIN assignment must require explicit approval and audit.

### D) Role-change reason note
Locked decisions:
- Role-change reason note is mandatory.
- Reason note must be stored in audit metadata when audit implementation lands.
- UI must require reason before role change.

### E) Disable/reactivate
Locked decisions:
- Disable/reactivate remains out of immediate MVP implementation unless current data model supports it safely.
- If no suitable disabled/status field exists, capture as future addendum instead of forcing migration now.
- Do not implement login blocking for disabled users until explicitly designed.

## 4) Role action matrix
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

## 5) Audit requirements
Locked audit requirements for production role changes:
- all production role changes must write audit_logs
- required audit event types:
  - INTERNAL_USER_ROLE_ASSIGNED
  - INTERNAL_USER_ROLE_CHANGED

Required audit payload fields:
- actor user id
- target user id
- previous role
- new role
- reason note
- source app ADMIN_PORTAL
- timestamp
- request id/trace id if available

## 6) UI implications
UI implications locked for MVP:
- MVP /admin/users starts with list and safe role assignment cases only.
- RoleChangeDialog must require reason note.
- unauthorized role options must be hidden or disabled by actor role.
- SUPER_ADMIN assignment option must not be shown in MVP.
- client UI restrictions are insufficient alone; server action authority checks are mandatory.

## 7) Server action implications
Future server actions must:
- use server-side actor role checks
- resolve actor role from DB
- validate target role
- validate reason note
- block self-role modification
- block ADMIN assigning ADMIN/SUPER_ADMIN
- block all SUPER_ADMIN assignment in MVP
- write audit_logs for successful role changes

## 8) Security rules
Locked security rules:
- no public role promotion
- no client-trusted role assignment
- no permission resolver dependency yet
- no middleware
- no DB schema changes in this decision phase
- no secrets

## 9) Explicit exclusions
- no implementation yet
- no UI yet
- no DB migration
- no permission resolver
- no SUPER_ADMIN assignment UI
- no disable/reactivate implementation
- no production invitation system

## 10) Final recommendation
Phase 2B.4.2 server action/API design can proceed.

Proceeding condition:
- implement strictly against this authority matrix and reason-note requirement, while keeping SUPER_ADMIN assignment outside MVP UI and outside non-approved production flows.
