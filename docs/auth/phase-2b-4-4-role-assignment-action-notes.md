# Phase 2B.4.4 Role Assignment Action Notes

Date: 2026-06-02
Scope: Implementation notes for server-side role assignment audit mapping

## Audit actionType preflight result
Verified from src/db/schema/audit.ts:
- audit_logs.actionType is varchar(40) and not enum-constrained.
- Required values fit length constraints:
  - INTERNAL_USER_ROLE_ASSIGNED
  - INTERNAL_USER_ROLE_CHANGED

## Mapping decision
No fallback mapping is required.

Implementation uses:
- actionType = INTERNAL_USER_ROLE_ASSIGNED for CUSTOMER -> AGENT or CUSTOMER -> ADMIN internal assignment
- actionType = INTERNAL_USER_ROLE_CHANGED for other allowed transitions

Metadata includes safe context:
- eventType
- actorUserId
- targetUserId
- previousRole
- newRole
- reasonNote
