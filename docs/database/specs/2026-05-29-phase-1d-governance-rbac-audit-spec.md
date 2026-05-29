# Phase 1D Governance, RBAC, and Audit Specification

Date: 2026-05-29
Scope: Phase 1D planning only
Status: Approved for implementation
References:
- docs/database/implementation-plan.md
- docs/database/decisions/2026-05-28-database-scope-decisions.md
- docs/database/reports/2026-05-28-phase-1a-verification-report.md
- docs/database/reports/2026-05-29-phase-1b-verification-report.md
- docs/database/reports/2026-05-29-phase-1c-verification-report.md
- docs/database/specs/2026-05-28-phase-1a-core-db-foundation-spec.md
- docs/database/specs/2026-05-29-phase-1b-lead-whatsapp-routing-spec.md
- docs/database/specs/2026-05-29-phase-1c-booking-documents-spec.md

## 1. Phase 1D objective
Phase 1D defines the governance baseline for MVP operations, focused on permission-level RBAC, auditable admin and agent actions, auth/security event logging, and practical runtime control through settings and feature flags.

Primary outcomes:
- Permission-level RBAC from day one with a small practical initial permission set.
- Role baseline from Phase 1A remains canonical while permission granularity is added.
- Clear admin and agent portal access boundaries with explicit customer boundary.
- Practical audit coverage for create/update/delete/approve/reject/verify sensitive actions.
- Auth/security event trail for login/logout/session/security events.
- Simple environment-aware system settings and feature flag controls.

Non-goals:
- Building a full workflow engine.
- Building full compliance/legal automation.

## 2. Tables included
Required Phase 1D tables:
- permissions
- permission_groups
- role_permissions
- user_permissions
- audit_logs
- auth_audit_logs
- system_settings
- feature_flags
- feature_flag_overrides
- admin_action_approvals

## 3. Tables excluded
Phase 1D explicit exclusions:
- Referral/reward tables
- Commission/payout tables
- Banker/lawyer modules
- Full workflow engine
- Full notification automation
- Full compliance/legal automation
- Payment gateway integration
- WhatsApp template automation
- Advanced AB testing / experimentation platform

## 4. Table-by-table field design
Field conventions align with existing schema style: text id PKs, created_at/updated_at, and deleted_at where soft-delete behavior is useful.

### 4.1 permission_groups
Purpose: Permission taxonomy module/grouping for discoverability and maintenance.

Fields:
- id: text primary key
- code: varchar(50) not null
- name: varchar(120) not null
- description: text nullable
- sortOrder: integer not null default 0
- isActive: boolean not null default true
- createdAt: timestamp not null default now()
- updatedAt: timestamp not null default now()
- deletedAt: timestamp nullable

### 4.2 permissions
Purpose: Action-level permission catalog.

Fields:
- id: text primary key
- groupId: text not null fk -> permission_groups.id
- code: varchar(120) not null (for example PROJECT_READ, BOOKING_APPROVE)
- name: varchar(150) not null
- description: text nullable
- moduleKey: varchar(50) not null (CATALOG, LEADS, BOOKINGS, DOCUMENTS, GOVERNANCE)
- actionKey: varchar(50) not null (READ, CREATE, UPDATE, DELETE, APPROVE, VERIFY, ASSIGN, EXPORT)
- resourceKey: varchar(80) not null (PROJECT, LEAD, BOOKING, DOCUMENT, USER, SYSTEM_SETTING)
- riskLevel: varchar(20) not null default MEDIUM (LOW, MEDIUM, HIGH, CRITICAL)
- isActive: boolean not null default true
- createdAt: timestamp not null default now()
- updatedAt: timestamp not null default now()
- deletedAt: timestamp nullable

### 4.3 role_permissions
Purpose: Default permission assignment by role.

Fields:
- id: text primary key
- roleId: text not null fk -> roles.id
- permissionId: text not null fk -> permissions.id
- grantScope: varchar(20) not null default ALLOW (ALLOW, DENY)
- conditionJson: jsonb nullable (for future conditional evaluation)
- grantedByUserId: text nullable fk -> users.id
- grantedAt: timestamp not null default now()
- revokedAt: timestamp nullable
- revokedByUserId: text nullable fk -> users.id
- reasonNote: text nullable
- createdAt: timestamp not null default now()
- updatedAt: timestamp not null default now()

### 4.4 user_permissions
Purpose: User-level overrides above role defaults.

Fields:
- id: text primary key
- userId: text not null fk -> users.id
- permissionId: text not null fk -> permissions.id
- overrideScope: varchar(20) not null (ALLOW, DENY)
- isTemporary: boolean not null default false
- effectiveFrom: timestamp nullable
- effectiveTo: timestamp nullable
- grantedByUserId: text nullable fk -> users.id
- grantedAt: timestamp not null default now()
- revokedAt: timestamp nullable
- revokedByUserId: text nullable fk -> users.id
- reasonCode: varchar(50) nullable
- reasonNote: text nullable
- createdAt: timestamp not null default now()
- updatedAt: timestamp not null default now()

### 4.5 audit_logs
Purpose: Business/operational action audit trail.

Fields:
- id: text primary key
- actorUserId: text nullable fk -> users.id
- actorRoleId: text nullable fk -> roles.id
- actionType: varchar(40) not null (CREATE, UPDATE, DELETE, APPROVE, REJECT, VERIFY, ASSIGN, OVERRIDE)
- entityType: varchar(60) not null
- entityId: text nullable
- requestId: varchar(120) nullable
- traceId: varchar(120) nullable
- beforeJson: jsonb nullable
- afterJson: jsonb nullable
- changeSummary: text nullable
- sourceApp: varchar(30) not null (ADMIN_PORTAL, AGENT_PORTAL, API)
- ipAddress: varchar(64) nullable
- userAgent: text nullable
- metadata: jsonb nullable
- createdAt: timestamp not null default now()

### 4.6 auth_audit_logs
Purpose: Authentication and security event trail.

Fields:
- id: text primary key
- userId: text nullable fk -> users.id
- eventType: varchar(50) not null (LOGIN_SUCCESS, LOGIN_FAILED, LOGOUT, SESSION_CREATED, SESSION_REVOKED, PASSWORD_RESET_REQUESTED, PASSWORD_RESET_COMPLETED, MFA_CHALLENGE_FAILED)
- eventStatus: varchar(20) not null (SUCCESS, FAILED, BLOCKED)
- providerId: varchar(60) nullable
- sessionId: text nullable fk -> session.id
- accountId: text nullable fk -> account.id
- riskLevel: varchar(20) not null default LOW
- failureReason: text nullable
- ipAddress: varchar(64) nullable
- userAgent: text nullable
- countryCode: varchar(10) nullable
- sourceApp: varchar(30) not null (ADMIN_PORTAL, AGENT_PORTAL, CUSTOMER_PORTAL, API)
- metadata: jsonb nullable
- occurredAt: timestamp not null default now()
- createdAt: timestamp not null default now()

### 4.7 system_settings
Purpose: Controlled system configuration storage.

Fields:
- id: text primary key
- key: varchar(120) not null
- valueJson: jsonb not null
- valueType: varchar(20) not null (STRING, NUMBER, BOOLEAN, JSON)
- category: varchar(50) not null
- environment: varchar(20) not null (DEVELOPMENT, STAGING, PRODUCTION, ALL)
- isSecret: boolean not null default false (store secret references only, never raw secret values)
- isReadOnly: boolean not null default false
- isActive: boolean not null default true
- updatedByUserId: text nullable fk -> users.id
- changeReason: text nullable
- createdAt: timestamp not null default now()
- updatedAt: timestamp not null default now()
- deletedAt: timestamp nullable

### 4.8 feature_flags
Purpose: Feature control baseline.

Fields:
- id: text primary key
- key: varchar(120) not null
- name: varchar(150) not null
- description: text nullable
- category: varchar(50) nullable
- isEnabled: boolean not null default false
- environment: varchar(20) not null (DEVELOPMENT, STAGING, PRODUCTION, ALL)
- rolloutMode: varchar(30) not null default GLOBAL (GLOBAL, ROLE_BASED, USER_BASED)
- rolloutPercentage: integer nullable
- prerequisitesJson: jsonb nullable
- sunsetAt: timestamp nullable
- updatedByUserId: text nullable fk -> users.id
- changeReason: text nullable
- createdAt: timestamp not null default now()
- updatedAt: timestamp not null default now()
- deletedAt: timestamp nullable

### 4.9 feature_flag_overrides
Purpose: Targeted feature override for role or user.

Fields:
- id: text primary key
- featureFlagId: text not null fk -> feature_flags.id
- roleId: text nullable fk -> roles.id
- userId: text nullable fk -> users.id
- overrideEnabled: boolean not null
- effectiveFrom: timestamp nullable
- effectiveTo: timestamp nullable
- updatedByUserId: text nullable fk -> users.id
- reasonNote: text nullable
- createdAt: timestamp not null default now()
- updatedAt: timestamp not null default now()

Constraint note:
- Exactly one of roleId or userId must be non-null.
- Implement as DB check constraint if practical; otherwise enforce as required application validation.

### 4.10 admin_action_approvals
Purpose: Two-step approval and override governance for high-risk admin actions.

Fields:
- id: text primary key
- actionType: varchar(50) not null
- targetEntityType: varchar(60) not null
- targetEntityId: text nullable
- requestedByUserId: text not null fk -> users.id
- requestedAt: timestamp not null default now()
- status: varchar(20) not null default PENDING (PENDING, APPROVED, REJECTED, CANCELLED, EXPIRED)
- dedupeKey: varchar(200) not null
- approvedByUserId: text nullable fk -> users.id
- approvedAt: timestamp nullable
- rejectedByUserId: text nullable fk -> users.id
- rejectedAt: timestamp nullable
- expiresAt: timestamp nullable
- requestReason: text nullable
- decisionReason: text nullable
- payloadJson: jsonb nullable
- createdAt: timestamp not null default now()
- updatedAt: timestamp not null default now()

## 5. Primary keys and foreign keys
Primary key strategy:
- All Phase 1D tables use text id primary key.

Foreign key linkage to existing modules:
- role_permissions.roleId -> roles.id
- role_permissions.permissionId -> permissions.id
- role_permissions.grantedByUserId -> users.id
- role_permissions.revokedByUserId -> users.id

- user_permissions.userId -> users.id
- user_permissions.permissionId -> permissions.id
- user_permissions.grantedByUserId -> users.id
- user_permissions.revokedByUserId -> users.id

- permissions.groupId -> permission_groups.id

- audit_logs.actorUserId -> users.id
- audit_logs.actorRoleId -> roles.id

- auth_audit_logs.userId -> users.id
- auth_audit_logs.sessionId -> session.id
- auth_audit_logs.accountId -> account.id

- system_settings.updatedByUserId -> users.id

- feature_flags.updatedByUserId -> users.id

- feature_flag_overrides.featureFlagId -> feature_flags.id
- feature_flag_overrides.roleId -> roles.id
- feature_flag_overrides.userId -> users.id
- feature_flag_overrides.updatedByUserId -> users.id

- admin_action_approvals.requestedByUserId -> users.id
- admin_action_approvals.approvedByUserId -> users.id
- admin_action_approvals.rejectedByUserId -> users.id

## 6. Unique constraints
Recommended uniqueness:
- permission_groups.code unique
- permissions.code unique
- role_permissions unique(roleId, permissionId) where revokedAt is null
- user_permissions unique(userId, permissionId) where revokedAt is null
- system_settings unique(key, environment) where deletedAt is null
- feature_flags unique(key, environment) where deletedAt is null
- feature_flag_overrides unique(featureFlagId, roleId) where roleId is not null and effectiveTo is null
- feature_flag_overrides unique(featureFlagId, userId) where userId is not null and effectiveTo is null
- admin_action_approvals unique(dedupeKey) where status = PENDING

## 7. Index recommendations
RBAC indexes:
- permissions(moduleKey, actionKey, isActive)
- role_permissions(roleId, revokedAt)
- user_permissions(userId, effectiveTo)
- user_permissions(permissionId, effectiveTo)

Audit indexes:
- audit_logs(entityType, entityId, createdAt)
- audit_logs(actorUserId, createdAt)
- audit_logs(actionType, createdAt)
- audit_logs(sourceApp, createdAt)

Auth/security indexes:
- auth_audit_logs(userId, occurredAt)
- auth_audit_logs(eventType, occurredAt)
- auth_audit_logs(eventStatus, occurredAt)
- auth_audit_logs(riskLevel, occurredAt)

Settings/flag indexes:
- system_settings(category, environment, isActive)
- feature_flags(environment, isEnabled)
- feature_flags(category, environment)
- feature_flag_overrides(featureFlagId, effectiveTo)
- admin_action_approvals(status, requestedAt)
- admin_action_approvals(requestedByUserId, status)

## 8. RBAC permission model
Model principles:
- Role baseline remains from Phase 1A roles table (SUPER_ADMIN, ADMIN, AGENT, CUSTOMER).
- Permission-level RBAC is required from day one, but the initial permission set must stay small and practical.
- DENY always outranks ALLOW across both user and role scopes.
- Effective permission resolution order:
  1. user_permissions explicit DENY
  2. role_permissions explicit DENY
  3. user_permissions explicit ALLOW
  4. role_permissions explicit ALLOW
  5. implicit deny
- Permission grouping via permission_groups supports maintainability by module.

Initial practical permission set (locked):
- Catalog: PROJECT_READ, PROJECT_CREATE, PROJECT_UPDATE, PROJECT_PUBLISH, UNIT_READ, UNIT_UPDATE
- Leads: LEAD_READ, LEAD_ASSIGN, LEAD_UPDATE_STATUS, LEAD_ACTIVITY_CREATE
- Bookings: BOOKING_READ, BOOKING_CREATE, BOOKING_UPDATE, BOOKING_APPROVE, BOOKING_REJECT, BOOKING_PAYMENT_VERIFY
- Documents: DOC_REQUEST, DOC_SUBMISSION_READ, DOC_VERIFY, DOC_VIEW_SENSITIVE, DOC_DOWNLOAD
- Governance: USER_READ, USER_UPDATE, ROLE_PERMISSION_MANAGE, USER_PERMISSION_OVERRIDE, FEATURE_FLAG_READ, FEATURE_FLAG_UPDATE, SYSTEM_SETTING_READ, SYSTEM_SETTING_UPDATE, AUDIT_READ

## 9. Role permission flow
1. Governance admin defines permissions and groups.
2. Default mappings are assigned in role_permissions per role.
3. Role permission changes are logged in audit_logs.
4. Revocation remains soft-state (revokedAt) for traceability.
5. Application permission cache is refreshed on role permission update.

Initial role mapping summary:
- SUPER_ADMIN: all permissions
- ADMIN: operational permissions plus AUDIT_READ, FEATURE_FLAG_READ, SYSTEM_SETTING_READ
- AGENT: PROJECT_READ, UNIT_READ, LEAD_READ, LEAD_UPDATE_STATUS, LEAD_ACTIVITY_CREATE, BOOKING_READ, BOOKING_CREATE, BOOKING_UPDATE, DOC_REQUEST, DOC_SUBMISSION_READ
- CUSTOMER: no internal portal/governance permissions in Phase 1D

## 10. User override flow
1. Admin submits temporary or permanent override in user_permissions.
2. Override can be time-bounded via effectiveFrom/effectiveTo.
3. If override is high-risk, it can require admin_action_approvals first.
4. User effective access is recalculated with override precedence.
5. Every grant/revoke action is logged in audit_logs.

## 11. Audit logging flow
1. Sensitive action occurs in admin/agent/API context.
2. Application writes audit_logs with actor, action, entity, before/after snapshots where practical.
3. CREATE/UPDATE/DELETE/APPROVE/REJECT/VERIFY/OVERRIDE are mandatory audit families.
4. Audit records are append-only at application layer; no update/delete in normal operations.
5. Query surfaces support compliance and incident investigation.

## 12. Auth/security event logging flow
1. Auth lifecycle events are captured from identity/auth workflows.
2. auth_audit_logs record LOGIN_SUCCESS/FAILED, LOGOUT, session lifecycle, and security failures.
3. Risk signals (for example repeated failures) are stored with eventStatus and riskLevel.
4. Correlation metadata (sessionId/accountId/requestId) supports traceability.
5. Customer, admin, and agent auth events use the same auth_audit_logs table and are partitioned by sourceApp.
6. Production retention target: auth_audit_logs kept for 365 days.
7. Retention/archive/delete jobs are not implemented in Phase 1D database work.

## 13. System settings and feature flag flow
1. Authorized admin updates system_settings or feature_flags.
2. Optional targeted override is created in feature_flag_overrides for role/user rollout.
3. Change reason and actor are stored.
4. Changes are audit-logged in audit_logs.
5. Runtime evaluation order for feature flags:
   - explicit user override
   - explicit role override
   - global flag value

Environment-aware rule:
- environment column prevents accidental cross-environment behavior drift.

Phase 1D targeting rule:
- feature_flag_overrides supports role/user targeting only.
- Area/project-based feature targeting is deferred.

## 14. Admin approval / override workflow
Approval pattern (for high-risk actions such as permission override, critical setting update, broad feature enable):
1. Requester creates pending record in admin_action_approvals.
2. Designated approver approves/rejects before execution.
3. On approval, protected action executes and audit_logs captures both approval and resulting change.
4. Expired or rejected requests cannot be executed.

This pattern provides governance depth without implementing a full workflow engine.

Two-step admin approval is required in MVP for:
- USER_PERMISSION_OVERRIDE
- ROLE_PERMISSION_MANAGE
- SYSTEM_SETTING_UPDATE in PRODUCTION
- FEATURE_FLAG_UPDATE in PRODUCTION when rolloutMode = GLOBAL

## 15. Privacy and security notes
- Avoid storing credential secrets in system_settings where possible; use secret managers for true secrets.
- Minimize personal data in audit logs; store references over raw sensitive payloads.
- Redact sensitive fields from beforeJson/afterJson when needed.
- Restrict audit and governance table read access to authorized roles.
- Keep immutable audit history policies explicit in application design.
- Production retention target: audit_logs kept for 730 days.
- Actual retention/archive/delete jobs are not implemented in Phase 1D database work.

Access boundary summary:
- Admin portal: broad operational and governance permissions, including approval actions.
- Agent portal: operational permissions only, no governance mutation rights by default.
- External/customer: no direct access to governance tables; only customer-facing domain APIs.

## 16. Seed strategy for Phase 1D
Seed goals:
- Bootstrap minimal, safe, deterministic governance baseline.

Recommended seed layers:
- permission_groups baseline by module.
- permissions baseline (small practical initial set).
- role_permissions baseline mapping for SUPER_ADMIN, ADMIN, AGENT, CUSTOMER.
- optional dev-only sample overrides and feature flags gated by explicit flag.

Seed principles:
- Idempotent upsert only.
- No production credentials or secrets in seed files.
- Environment guards for any dev-only bootstrap behavior.

## 17. Migration implementation order
Recommended order:
1. Create permission_groups and permissions.
2. Create role_permissions and user_permissions.
3. Create audit_logs and auth_audit_logs.
4. Create system_settings.
5. Create feature_flags and feature_flag_overrides.
6. Create admin_action_approvals.
7. Add uniqueness and query indexes.
8. Add stricter checks (for example role/user override XOR constraint) after initial validation if needed.

## 18. Risks and edge cases
- Permission drift between role defaults and many user overrides.
- Conflicting overrides (ALLOW and DENY timing overlaps).
- Excessive audit payload size and storage growth.
- Missing audit events due to inconsistent instrumentation in APIs.
- Feature flag override ambiguity if both role and user overrides exist.
- Approval bypass risk if enforcement is not centralized.
- Cross-environment settings contamination without strict controls.

Mitigations:
- Effective permission resolver with deterministic precedence and tests.
- Strict override lifecycle with optional expiry and mandatory reason notes.
- Audit retention and archiving policy.
- Shared middleware for guaranteed action logging.
- Centralized approval guard for high-risk operations.

## 19. Final implementation decisions
- Permission-level RBAC is required from day one, with a small practical initial permission set.
- DENY always outranks ALLOW across both user and role scopes.
- Effective permission order is locked as:
  1. user_permissions explicit DENY
  2. role_permissions explicit DENY
  3. user_permissions explicit ALLOW
  4. role_permissions explicit ALLOW
  5. implicit deny
- Two-step admin approval is required in MVP for USER_PERMISSION_OVERRIDE, ROLE_PERMISSION_MANAGE, SYSTEM_SETTING_UPDATE in PRODUCTION, and FEATURE_FLAG_UPDATE in PRODUCTION when rolloutMode = GLOBAL.
- audit_logs production retention target is 730 days.
- auth_audit_logs production retention target is 365 days.
- Retention/archive/delete jobs are not implemented in Phase 1D database work.
- feature_flag_overrides supports role/user targeting only in Phase 1D.
- Area/project-based feature targeting is deferred.
- Customer, admin, and agent auth events use the same auth_audit_logs table and are partitioned by sourceApp.
- system_settings.isSecret stores secret references only, not raw secret values.
- feature_flag_overrides requires exactly one of roleId or userId to be non-null.
- Implement roleId/userId XOR as DB check constraint if practical; otherwise enforce as required application validation.

## 20. Final recommendation on whether Phase 1D is ready to implement
Recommendation: READY FOR IMPLEMENTATION.

Rationale:
- Table set and flows align with implementation plan and locked scope decisions.
- Design connects cleanly to Phase 1A users/roles and Phase 1B/1C operational modules.
- Owner direction is preserved: practical permission-level RBAC, clear portal boundaries, and auditable control surface without over-engineering.
