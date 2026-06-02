# Phase 2B Internal User Provisioning + Admin/Agent Test Accounts Specification

Date: 2026-06-02
Phase: 2B
Scope: Planning/specification only
Status: Draft for implementation planning

References:
- docs/auth/phase-2a-auth-access-integration-closure-report.md
- docs/auth/phase-2a-5-route-protection-role-guards-spec.md
- docs/auth/phase-2a-5-route-guards-verification-report.md
- docs/auth/phase-2a-6-sign-out-verification-report.md
- docs/database/reports/2026-05-29-phase-1d-verification-report.md
- src/db/schema/identity-auth.ts
- src/db/schema/governance-rbac.ts
- src/db/schema/audit.ts
- src/db/schema/relations.ts
- src/lib/auth/server.ts
- src/lib/auth/guards.ts
- src/config/roles.ts
- src/config/routes.ts
- package.json

## 1) Objective
Define safe internal user provisioning for AGENT, ADMIN, and SUPER_ADMIN users.

This specification targets:
- enabling internal test accounts for pending route-guard and sign-out verification
- preserving public self-service auth as CUSTOMER-only
- sequencing a safe path from dev-only test provisioning toward production-safe internal user management

This is planning only. No runtime implementation is included in this document.

## 2) Current status
Confirmed current state:
- CUSTOMER Google OAuth flow works.
- CUSTOMER phone OTP flow works.
- CUSTOMER route-guard and sign-out behavior works.
- AGENT and ADMIN route/sign-out tests remain pending.
- No internal user provisioning UI exists yet.
- roles table already exists in identity schema.
- users.roleId already supports role assignment.

## 3) User categories
Defined categories for Phase 2B governance:
- CUSTOMER: public self-registration through Google OAuth or phone OTP.
- AGENT: internal user, created or promoted through internal-only process.
- ADMIN: internal user, created or promoted through internal-only process.
- SUPER_ADMIN: highest internal user, created or promoted through internal-only process with stricter operational control.

## 4) Public auth policy
Policy lock for Phase 2B and onward:
- Public Google OAuth creates CUSTOMER only.
- Public phone OTP creates CUSTOMER only.
- Public auth must never create AGENT, ADMIN, or SUPER_ADMIN.
- Existing internal users keep their assigned roles when logging in.

## 5) Internal provisioning options
Option A: Dev-only SQL/manual role update
- Pros: fastest path for immediate local verification.
- Cons: not production-safe and weakly repeatable.
- Fit: temporary route-guard/sign-out verification only.

Option B: Seeded dev internal test users
- Pros: repeatable local/UAT testing baseline.
- Cons: must be strictly environment-gated and prevented from production use.
- Fit: recommended near-term testing strategy.

Option C: Admin UI for internal user management
- Pros: correct long-term operational model.
- Cons: larger scope requiring governance rules, audit instrumentation, and hardened admin permissions.
- Fit: later phase after foundational test-account strategy is complete.

Recommended sequence:
- Phase 2B.1: planning/specification.
- Phase 2B.2: dev-only internal test user strategy.
- Phase 2B.3: admin internal user management planning.
- full production-capable UI later.

## 6) MVP decision
Recommended MVP decision:
- Use dev-only test account creation/promotion first.
- Keep production internal user management deferred until admin UI planning is approved.
- Do not expose any public promotion endpoint.

## 7) Role assignment rules
Assignment rules for Phase 2B:
- CUSTOMER may be provisioned through public auth.
- AGENT, ADMIN, and SUPER_ADMIN assignment must be internal-only.
- No auto-upgrade behavior.
- No role repair during login flows.
- Role changes should be audited when production-safe provisioning is introduced.
- SUPER_ADMIN assignment should require explicit manual approval policy in later implementation.

## 8) Data model impact
Data model confirmation:
- users.roleId exists and supports role linking.
- roles table exists and provides canonical role codes.
- role_permissions exists from Phase 1D governance baseline.
- No DB schema change is expected for simple role assignment/provisioning MVP.
- If invitation/provisioning metadata fields are needed later, document in a separate approved addendum.

## 9) Audit and governance expectations
Future audit events to define and instrument in implementation phases:
- INTERNAL_USER_CREATED
- INTERNAL_USER_ROLE_ASSIGNED
- INTERNAL_USER_ROLE_CHANGED
- INTERNAL_USER_DISABLED
- INTERNAL_USER_REACTIVATED

MVP dev-only test-account expectation:
- Audit logging can be deferred for pure dev-only temporary account bootstrap.
- Production role changes should eventually write audit_logs with actor, target, reason, and timestamp metadata.

## 10) Test account strategy
Planned test account baseline:
- one AGENT test account
- one ADMIN test account
- optional SUPER_ADMIN test account

Compatibility expectations:
- phone OTP login compatibility for each internal test account where phone is configured.
- Google login compatibility where email/provider linkage exists.
- role guard verification usage across /agent and /admin boundaries.

Operational guardrails:
- test accounts must be development/UAT-gated.
- no production leakage from dev-only seed/provisioning paths.

## 11) Route guard test completion plan
After internal test users are available, execute:
- AGENT can access /agent.
- AGENT cannot access /admin and redirects to /agent.
- ADMIN can access /admin.
- ADMIN cannot access /agent and redirects to /admin.
- SUPER_ADMIN can access /admin.
- Auth-page redirect behavior works for AGENT and ADMIN.

## 12) Security rules
Security constraints for Phase 2B planning and implementation:
- No public role promotion.
- No client-side role trust.
- No public API accepting arbitrary role assignment.
- No production leakage of dev seed/provisioning paths.
- No secrets in documentation.
- No DB schema changes in this planning phase.

## 13) Exclusions
Out of scope for this Phase 2B planning task:
- implementation code
- admin UI implementation
- public promotion endpoint
- permission resolver implementation
- middleware implementation
- production invitation system
- DB migration work unless later approved

## 14) Proposed implementation phases
- 2B.1 Internal user provisioning specification
- 2B.2 Dev-only internal test user creation/promotion command or seed
- 2B.3 Complete AGENT/ADMIN route guard verification
- 2B.4 Admin user management UI planning
- 2B.5 Production-safe internal user provisioning implementation later

## 15) Final recommendation
Phase 2B.2 can proceed after approval.

Proceeding conditions:
- keep all provisioning paths internal-only and environment-gated
- keep public auth restricted to CUSTOMER
- treat dev-only strategy as a verification enabler, not final production design
