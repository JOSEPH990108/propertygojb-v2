# Phase 2B.4 Admin Internal User Management UI Specification

Date: 2026-06-02
Phase: 2B.4
Scope: Planning/specification only
Status: Draft for implementation planning

References:
- docs/auth/phase-2b-internal-user-provisioning-spec.md
- docs/auth/phase-2b-2-dev-internal-test-user-provisioning-report.md
- docs/auth/phase-2b-3-agent-admin-route-guard-verification-report.md
- docs/auth/phase-2a-auth-access-integration-closure-report.md
- docs/database/reports/2026-05-29-phase-1d-verification-report.md
- src/db/schema/identity-auth.ts
- src/db/schema/governance-rbac.ts
- src/db/schema/audit.ts
- src/lib/auth/guards.ts
- src/app/(internal)/admin/page.tsx
- src/config/routes.ts
- src/config/roles.ts
- package.json

## 1) Objective
Define an admin UI specification for internal user management.

Primary goals:
- allow ADMIN and SUPER_ADMIN to create, view, update, disable, and role-assign internal users safely
- enable production-safe internal user management to replace dev-only provisioning script usage
- keep public auth restricted to CUSTOMER only

This is planning only. No runtime implementation is included in this document.

## 2) Current status
Confirmed baseline:
- public CUSTOMER auth works through Google OAuth and phone OTP
- AGENT and ADMIN route guards are verified
- dev-only internal provisioning script exists but is not production user management
- admin dashboard remains a placeholder shell
- permission-level RBAC resolver is not implemented yet

## 3) User management scope
MVP admin functions:
- list users
- search and filter users
- view user details
- create internal user placeholder or invite record (if suitable in existing model)
- assign role: AGENT or ADMIN
- disable and reactivate user
- basic audit/history read path later in MVP progression

Out of MVP or later:
- full invitation email workflow
- password login
- full permission editor
- SUPER_ADMIN assignment UI
- team hierarchy or branch assignment
- advanced audit dashboard

## 4) Role policy
Policy lock:
- CUSTOMER can self-register publicly
- AGENT and ADMIN are internal-only roles
- SUPER_ADMIN cannot be assigned casually through MVP UI
- existing roles are preserved unless changed by authorized admin action
- no public promotion endpoint
- no auto-upgrade
- no role repair during login

## 5) Access policy
Access rules:
- ADMIN and SUPER_ADMIN can access admin user management routes
- AGENT cannot access admin user management routes
- CUSTOMER cannot access admin user management routes
- future SUPER_ADMIN-only controls should be separated as explicit privileged actions
- MVP should rely on existing route guard and admin layout protection first
- permission-level RBAC integration comes later

## 6) Data model impact
Current model confirmation:
- users table has roleId
- roles table exists
- audit_logs exists
- no DB schema change is expected for basic role assignment flow
- if invitation/disable metadata is missing, capture needs in a future addendum rather than forcing immediate migration

## 7) Audit requirements
Future implementation audit events:
- INTERNAL_USER_CREATED
- INTERNAL_USER_ROLE_ASSIGNED
- INTERNAL_USER_ROLE_CHANGED
- INTERNAL_USER_DISABLED
- INTERNAL_USER_REACTIVATED

Recommended audit payload:
- actor user id
- target user id
- previous role
- new role
- reason note if available
- source app ADMIN_PORTAL
- request id and trace id when available

## 8) UI page proposal
Proposed routes:
- /admin/users
- /admin/users/new
- /admin/users/[id]
- optional /admin/users/[id]/edit

MVP starting point:
- /admin/users list page
- simple role action flow from list/detail context
- detail page can follow after list stabilization

## 9) Component proposal
Reusable component candidates:
- AdminUsersTable
- UserRoleBadge
- UserStatusBadge
- RoleChangeDialog
- DisableUserDialog
- UserSearchFilters
- UserDetailPanel

Design principle:
- keep components DRY, composable, and reusable across admin user-management flows

## 10) API / server action proposal
Possible server-side actions:
- listInternalUsers
- getInternalUserById
- assignUserRole
- disableUser
- reactivateUser

Rules:
- server-side validation only
- no client-trusted role assignment
- actor must be ADMIN or SUPER_ADMIN
- no public endpoint for role management

## 11) Safety decisions needed before implementation
Open decisions:
- should ADMIN be allowed to create another ADMIN
- should only SUPER_ADMIN assign ADMIN
- should SUPER_ADMIN assignment be excluded completely from MVP UI
- should disabled users be blocked from login immediately
- should role changes require reason note

Recommended safe defaults:
- ADMIN can assign AGENT only
- SUPER_ADMIN can assign ADMIN later (post explicit policy approval)
- SUPER_ADMIN assignment excluded from MVP UI
- disabled-user login blocking deferred if no field exists yet
- role change reason note recommended

## 12) Implementation phases
- 2B.4.1 admin user management UI planning/spec approval
- 2B.4.2 server action/API design
- 2B.4.3 users list page
- 2B.4.4 role assignment action with audit
- 2B.4.5 disable/reactivate planning or addendum
- 2B.4.6 verification report

## 13) Test checklist
Planned verification checklist:
- ADMIN can view /admin/users
- AGENT cannot view /admin/users
- CUSTOMER cannot view /admin/users
- ADMIN can assign AGENT role if approved
- ADMIN cannot assign SUPER_ADMIN
- role change updates users.roleId
- role guard behavior updates after next login/session refresh
- audit event written for role change when implementation lands
- public auth remains CUSTOMER-only

## 14) Exclusions
- no implementation yet
- no DB migration
- no public promotion endpoint
- no password login
- no production invitation system
- no full RBAC permission editor
- no SUPER_ADMIN assignment UI in MVP
- no middleware

## 15) Final recommendation
Phase 2B.4 implementation planning can proceed.

Decision that must be locked before code:
- authority boundary for ADMIN versus SUPER_ADMIN in role assignment (especially ADMIN assignment rights)
- SUPER_ADMIN assignment exclusion policy for MVP UI
- whether role-change reason note is mandatory for audited write actions
