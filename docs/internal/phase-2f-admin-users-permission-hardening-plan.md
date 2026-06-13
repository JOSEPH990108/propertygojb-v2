# Phase 2F Admin Users Permission Hardening Plan

Date: 2026-06-13
Phase: 2F (O10)
Scope: Planning and execution sequencing for admin users permission-level resolver
Status: Completed

## 1. Objective
Close deferred permission-level resolver gap in admin users module so role-assignment behavior is explicitly policy-enforced and verifiable.

## 2. Scope Boundaries
In scope:
- permission-level resolver acceptance definition,
- backend enforcement in admin role-assignment path,
- UI alignment for permission-aware actions/messages,
- runtime + automated verification evidence.

Out of scope:
- new role type introduction,
- broad RBAC schema redesign,
- external admin portal redesign,
- cross-module permission framework expansion beyond admin users slice.

## 3. Execution Sequence
1. O10-T01: define acceptance criteria and boundary matrix (done).
2. O10-T02: implement backend permission resolver and enforce role-change policy (done).
3. O10-T03: align admin users UI with permission constraints (done).
4. O10-T04: execute runtime verification and collect evidence (done).
5. O10-T05: add targeted automated tests for permission policy paths (done).

## 4. Candidate Affected Files
- src/lib/admin/users/actions.ts
- src/lib/admin/users/role-policy.ts
- src/lib/admin/users/server-actions.ts
- src/components/admin/users/role-change-dialog.tsx
- src/components/admin/users/admin-users-table.tsx
- src/app/(internal)/admin/users/page.tsx
- docs/internal/*
- docs/ai-orchestrator/*

## 5. Acceptance Criteria
- Permission resolver returns deterministic allowed/disallowed decision for all role-change combinations in scope.
- Backend blocks unauthorized role-change attempts even if client payload is forged.
- UI disables or hides blocked actions and shows safe policy-consistent feedback.
- Audit trail remains intact for allowed changes; blocked paths do not write success audit events.
- Runtime and test evidence covers allow/deny matrix for ADMIN and SUPER_ADMIN actors.

## 6. Permission Boundary Matrix (O10-T01)

### 6.1 Global pre-check rules
- Self-target role change: blocked (`SELF_ROLE_CHANGE_BLOCKED`).
- Assigning `SUPER_ADMIN` role: blocked (`SUPER_ADMIN_ASSIGNMENT_BLOCKED`).
- Target current role is `SUPER_ADMIN`: blocked (`SUPER_ADMIN_TARGET_BLOCKED`).
- No-op role change (`previousRole === targetRole`): blocked (`ROLE_CHANGE_NOT_ALLOWED`).

### 6.2 Actor = ADMIN
| Previous role | Target role | Expected result |
| --- | --- | --- |
| CUSTOMER | AGENT | Allow |
| AGENT | CUSTOMER | Allow |
| CUSTOMER | ADMIN | Block (`ROLE_CHANGE_NOT_ALLOWED`) |
| AGENT | ADMIN | Block (`ROLE_CHANGE_NOT_ALLOWED`) |
| ADMIN | CUSTOMER/AGENT/ADMIN | Block (`ROLE_CHANGE_NOT_ALLOWED`) |
| SUPER_ADMIN | CUSTOMER/AGENT/ADMIN | Block (`SUPER_ADMIN_TARGET_BLOCKED`) |

### 6.3 Actor = SUPER_ADMIN
| Previous role | Target role | Expected result |
| --- | --- | --- |
| CUSTOMER | AGENT / ADMIN | Allow |
| AGENT | CUSTOMER / ADMIN | Allow |
| ADMIN | CUSTOMER / AGENT | Allow |
| CUSTOMER / AGENT / ADMIN | Same role | Block (`ROLE_CHANGE_NOT_ALLOWED`) |
| SUPER_ADMIN | CUSTOMER / AGENT / ADMIN | Block (`SUPER_ADMIN_TARGET_BLOCKED`) |

## 7. Verification Plan
- npm run lint
- npx tsc --noEmit
- npm run test
- manual role-change matrix checks in admin users flow

## 8. Immediate Next Step
Phase O10 scope is complete. Proceed to next prioritized orchestrator phase.
