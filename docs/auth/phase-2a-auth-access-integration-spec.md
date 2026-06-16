# Phase 2A Auth + Access Integration Specification

Date: 2026-05-29
Scope: Phase 2A planning only
Status: Approved for implementation
References:
- docs/database/reports/2026-05-29-post-phase-1-database-closure-integration-readiness-report.md
- docs/database/reports/2026-05-29-phase-1d-verification-report.md
- docs/database/implementation-plan.md
- src/db/schema/index.ts
- src/db/schema/identity-auth.ts
- src/db/schema/governance-rbac.ts
- src/db/schema/audit.ts
- src/config/routes.ts
- src/config/roles.ts
- src/app/(auth)/login/page.tsx
- src/app/(auth)/register/page.tsx
- src/app/(auth)/verify-otp/page.tsx
- package.json

## 1. Phase 2A objective
Phase 2A delivers runtime authentication and access enforcement on top of completed Phase 1A-1D database foundations.

Primary outcomes:
- Wire Better Auth runtime using existing identity/auth tables.
- Implement production-ready login/register journeys for Google OAuth and mobile OTP.
- Implement session retrieval and protected route enforcement.
- Implement runtime RBAC permission resolution using Phase 1D tables.
- Emit auth and access audit logs for security and incident traceability.

Non-goals for Phase 2A:
- No database schema changes.
- No migration generation, migration execution, or seed execution.
- No feature expansion outside auth/access integration.

## 2. Current auth implementation status
Current state confirms UI scaffolding and data-model readiness, but runtime auth is not integrated yet.

Implemented now:
- Auth route paths and placeholders exist for login/register/verify-otp.
- Roles and route config constants exist.
- Identity/auth tables, governance RBAC tables, and auth audit tables exist in schema.
- Better Auth packages are installed in dependencies.

Missing now:
- Better Auth runtime initialization and handler wiring.
- Auth API route handlers.
- Google OAuth runtime config usage.
- OTP request/verify endpoints and anti-abuse controls.
- Session middleware and server-side route guards.
- Runtime permission resolver and RBAC enforcement at request/action boundaries.

## 3. Better Auth runtime setup plan
Plan to introduce a single auth runtime module and a minimal set of adapter wrappers.

Planned design:
- Create an auth runtime module (single source of truth) that:
  - Initializes Better Auth once.
  - Uses Drizzle adapter pointing to existing database connection.
  - Maps to existing identity-auth schema tables (users, session, account, verification).
- Create API route handler endpoint under app router for Better Auth request handling.
- Add a server-side helper for session retrieval from request context.
- Add a client-safe helper for auth client calls from login/register/verify pages.

Integration constraints:
- Reuse existing table names and columns from Phase 1A.
- No schema mutation in Phase 2A.
- Keep provider and OTP configuration environment-driven and fail-fast when missing.

## 4. Google OAuth login/register flow
Google OAuth flow will support both first-time sign-up and returning login through one provider journey.

Planned flow:
1. User clicks Continue with Google on login or register page.
2. Client invokes Better Auth social sign-in for Google provider.
3. On callback success:
   - Resolve or create user record via Better Auth account linkage.
   - Ensure role assignment policy is applied (default role if new user).
   - Create session and set secure cookie.
   - Emit auth audit event with providerId=google.
4. Redirect by role-based redirect rules.

Failure handling:
- Provider rejection, callback mismatch, missing profile email, or state mismatch must return safe user-facing errors.
- Failed attempts write auth audit logs with eventStatus=FAILED and failureReason.

## 5. Mobile number + OTP login/register flow
OTP flow supports both new-user registration and returning-user login with phone verification.

Planned flow:
1. User submits mobile number from login/register.
2. System normalizes phone input and checks eligibility/rate limits.
3. System issues OTP challenge (hashed token storage, ttl, attempt counters, resend cooldown).
4. OTP is delivered through provider abstraction.
5. User submits OTP on verify page.
6. System verifies challenge atomically:
   - Valid challenge + within ttl + attempts not exceeded + not consumed.
   - Mark challenge consumed to prevent replay.
   - Mark user phone verified where applicable.
7. Session is created and user redirected by role rules.

Registration versus login behavior:
- If phone has no user: create user profile using registration intent and default role.
- If phone has user: treat as login and continue with existing identity.

## 6. Dev OTP console.log strategy
Development mode requires fast feedback without external OTP dependency.

Strategy:
- In development only, OTP provider adapter logs masked OTP payload to console.
- Log format includes requestId, masked phone, otp code, ttl seconds, and resend availability timestamp.
- Never log raw session tokens, access tokens, refresh tokens, or secret env values.
- Keep logs gated by APP_ENV/development check to prevent accidental use in UAT/production.

## 7. UAT/Production OTP provider boundary
Provider behavior is split by environment with strict boundary rules.

Boundary rules:
- Development: console/log provider allowed.
- UAT/Production: external provider required (SMS/WhatsApp OTP provider abstraction).
- Startup validation must fail if UAT/Production runs with dev provider.
- Provider credentials sourced from environment variables only.
- No secrets in code, logs, or docs.

## 8. Session handling strategy
Session handling must be server-first and enforced at route boundaries.

Plan:
- Use Better Auth session cookies with secure settings per environment.
- Retrieve session server-side in middleware/route guards and protected server handlers.
- Apply idle/absolute expiry policy from auth configuration.
- Rotate/revoke sessions on sensitive operations (password change, role-critical changes, security alerts).
- Write auth audit logs for session created/refreshed/revoked/expired/failure events.

Session controls:
- HttpOnly cookies.
- Secure cookies on non-development environments.
- SameSite policy tuned for auth callback compatibility.
- CSRF protections for state-changing auth operations.

## 9. Role-based redirect rules
Role redirects happen immediately after successful auth and session creation.

Redirect map:
- super_admin, admin -> /admin
- agent -> /agent
- customer -> /
- unknown or missing role -> /login with safe error state

Behavioral notes:
- Redirect decision uses canonical role from user profile.
- Customer is explicitly denied admin/agent route entry.
- Direct navigation to unauthorized area must redirect to allowed area with denial audit event.

## 10. Admin / Agent / Customer route guard strategy
Route guards will enforce both authentication and area-level role access.

Guard model:
- Public routes: always accessible.
- Auth routes: accessible when unauthenticated; optionally redirect authenticated users to role landing.
- Admin routes (/admin*): authenticated + role with admin area access required.
- Agent routes (/agent*): authenticated + role with agent area access required.
- Customer handling:
  - Current app has no dedicated customer internal area yet.
  - Customer is blocked from /admin* and /agent*.
  - Customer remains in public/auth route space for Phase 2A.

Enforcement layers:
- Middleware-level coarse gate (auth + area).
- Server action/API-level fine gate (permission resolver).

## 11. Permission resolver design
Permission resolver computes effective allow/deny at runtime from role and user permission grants.

Inputs:
- userId
- roleId
- permission code requested by action
- current timestamp for temporary windows

Resolution behavior:
- Load active permission by code.
- Load active role_permissions for role+permission.
- Load active user_permissions for user+permission within effective window.
- Evaluate according to configured precedence order.
- Return decision object:
  - allow: boolean
  - source: USER_DENY | ROLE_DENY | USER_ALLOW | ROLE_ALLOW | IMPLICIT_DENY
  - permissionCode
  - evaluatedAt

Operational notes:
- Implement request-level caching to avoid duplicate DB lookups inside one request.
- Emit audit log for denied high-risk actions.

## 12. RBAC effective permission order
Phase 2A runtime must enforce the same precedence documented in Phase 1D baseline.

Effective order:
1. USER_DENY
2. ROLE_DENY
3. USER_ALLOW
4. ROLE_ALLOW
5. IMPLICIT_DENY

Constraint:
- If conflicting grants exist, first match in the order above is final.

## 13. Auth audit logging events
Phase 2A must instrument auth_audit_logs and selected audit_logs entries.

Auth audit event baseline:
- LOGIN_SUCCESS
- LOGIN_FAILED
- REGISTER_SUCCESS
- REGISTER_FAILED
- OAUTH_CALLBACK_SUCCESS
- OAUTH_CALLBACK_FAILED
- OTP_REQUESTED
- OTP_SENT
- OTP_DELIVERY_FAILED
- OTP_VERIFY_SUCCESS
- OTP_VERIFY_FAILED
- OTP_MAX_ATTEMPTS_LOCKED
- OTP_RESEND_BLOCKED
- SESSION_CREATED
- SESSION_REVOKED
- SESSION_EXPIRED
- ACCESS_DENIED_ROUTE
- ACCESS_DENIED_PERMISSION
- LOGOUT

Required captured fields:
- userId (if known)
- eventType
- eventStatus
- providerId (google/otp/sms/whatsapp/credential)
- sessionId/accountId when available
- riskLevel
- failureReason when failed
- ipAddress, userAgent, sourceApp
- metadata (requestId, route, permissionCode, cooldown/attempt counters where relevant)

## 14. Security controls
Security controls are mandatory for OTP and access flows.

OTP expiry:
- Short-lived OTP validity window (recommended: 5 minutes default).
- Expired OTP cannot be retried or reused.

Resend cooldown:
- Per phone + per session cooldown (recommended: 30-60 seconds).
- Return remaining cooldown in safe response payload.

Max attempts:
- Per challenge max attempts (recommended: 5).
- On exceed, challenge locked and new OTP required.

Rate limiting:
- Endpoint-level limits for request and verify APIs.
- Scope by IP and by normalized phone identifier.
- Progressive penalties for repeated abuse patterns.

Replay protection:
- OTP challenge marked consumed atomically on success.
- One-time use strictly enforced.
- Duplicate verification attempts for consumed challenge are denied and audited.

OTP persistence decision gate:
- OTP challenge state must be persisted safely.
- Prefer existing Better Auth / Phase 1A verification table only if it safely supports hashed OTP, expiresAt, attempt count, consumed/replay protection, resend cooldown, and lockout metadata.
- If current verification table cannot safely support this, implementation must pause and create a small reviewed Phase 2A DB addendum before OTP coding.
- Memory-only OTP storage is not allowed as final implementation and can only be used for temporary local-only experiments.

Additional controls:
- Uniform error messages to reduce enumeration risk.
- Mask phone values in logs and responses.
- Request correlation IDs for incident tracing.

## 15. Files expected to be created/updated
Planned implementation footprint for Phase 2A execution (not part of this planning-only task).

Expected to create:
- src/lib/auth/server.ts
- src/lib/auth/client.ts
- src/lib/auth/providers/google.ts
- src/lib/auth/providers/otp.ts
- src/lib/auth/permission-resolver.ts
- src/lib/auth/route-guards.ts
- src/app/api/auth/[...all]/route.ts
- src/app/api/auth/otp/request/route.ts
- src/app/api/auth/otp/verify/route.ts
- src/middleware.ts

Expected to update:
- src/app/(auth)/login/page.tsx
- src/app/(auth)/register/page.tsx
- src/app/(auth)/verify-otp/page.tsx
- src/config/routes.ts
- src/config/roles.ts
- src/components/layout/public-shell.tsx
- src/components/layout/internal-workspace.ts

Notes:
- No changes to src/db schema files in Phase 2A.
- No migration or seed file changes in Phase 2A.
- Phase 2A implementation should avoid DB schema changes by default.
- Exception: if OTP persistence cannot be safely implemented using existing tables, create a separate reviewed DB addendum before coding OTP.

## 16. Implementation phases
Execution should be staged to reduce integration risk.

Phase 2A.1 Better Auth runtime foundation:
- Add Better Auth runtime module and app router handler.
- Add session retrieval helper and auth client helper.

Phase 2A.2 Google OAuth:
- Implement Google login/register triggers and callback handling.
- Apply default CUSTOMER assignment for new public users.
- Add redirect orchestration and auth audit instrumentation.

Phase 2A.3 OTP persistence decision check:
- Validate whether existing verification table can safely support OTP persistence requirements.
- If not safe, stop OTP coding and open reviewed Phase 2A DB addendum.

Phase 2A.4 OTP request/verify flow:
- Implement OTP request/verify endpoints with cooldown, expiry, attempts, and replay controls.
- Wire login/register/verify UI to APIs.

Phase 2A.5 Route guards:
- Add middleware area guard.
- Enforce admin/agent/customer route boundaries.

Phase 2A.6 Permission resolver:
- Add runtime permission resolver.
- Enforce permission checks on protected server operations.

Phase 2A.7 Audit/auth audit hooks:
- Add complete auth_audit_logs and relevant audit_logs instrumentation across auth/access events.

Phase 2A.8 Verification report:
- Execute lint/typecheck/tests.
- Produce Phase 2A verification report for closure.

## 17. Test checklist
Minimum test checklist before Phase 2A closure.

Unit tests:
- Permission resolver precedence cases (all combinations).
- OTP policy checks: expiry, resend cooldown, max attempts, replay lock.
- Role-based redirect resolver.

Integration tests:
- Google OAuth success/failure callback handling.
- OTP request/verify success and failure matrix.
- Session creation, read, expiry/revocation behavior.
- Route guard outcomes for admin/agent/customer/unauthenticated users.
- Permission denial and allow decisions at protected actions.

E2E tests:
- Login via Google to correct landing page.
- Login/register via OTP to correct landing page.
- Unauthorized access redirects for /admin and /agent.
- Audit event generation for critical auth/access actions.

Security tests:
- OTP brute force simulation (attempt lock).
- Resend spam behavior under cooldown and rate limit.
- Replay attempt after successful verification.
- Enumeration resistance checks (response uniformity).

## 18. Risks and blockers
Primary risks:
- Better Auth API/version drift against integration assumptions.
- Missing or inconsistent environment config across dev/uat/prod.
- OTP provider reliability and delivery latency in UAT.
- Middleware/guard bypass if not consistently applied to all protected entry points.
- Redirect loops if auth route handling and middleware rules conflict.
- Permission resolver performance if query strategy is not optimized.

Potential blockers:
- No finalized OTP provider contract for UAT/production.
- No finalized list of protected server actions requiring permission checks.
- Incomplete decision on customer internal route roadmap (currently none).

Mitigations:
- Introduce provider abstraction and environment startup validation.
- Define protected-action inventory before implementation sprint.
- Add request-level resolver caching and targeted indexes usage checks.

## 19. Final implementation decisions
Locked scope and policy decisions for Phase 2A:

- Phase 2A supports Google OAuth and mobile number + OTP.
- Email/password login is deferred unless explicitly approved later.
- Forgot password page remains placeholder/disabled until password auth is approved.
- Public self-registration always creates CUSTOMER role only.
- ADMIN, AGENT, and SUPER_ADMIN cannot self-register through public auth.
- Internal users must be created or promoted by authorized admin workflow later.
- Canonical role codes are SUPER_ADMIN, ADMIN, AGENT, CUSTOMER.
- Role redirects are:
  - SUPER_ADMIN and ADMIN -> /admin
  - AGENT -> /agent
  - CUSTOMER -> /
  - missing/unknown role -> /login with safe error state
- manager is removed from Phase 2A role redirect rules unless explicitly introduced later.
- Google OAuth creates CUSTOMER by default for new public users.
- Google OAuth account linking is allowed only when provider email is verified and matches an existing user email.
- Google OAuth must not auto-upgrade role.
- Role assignment remains controlled by DB/admin workflow.

## 20. Final recommendation before implementation
Proceed with Phase 2A implementation immediately as a focused runtime integration sprint, keeping strict boundaries:
- No database schema changes.
- No migrations or seeds.
- Auth and access enforcement first, feature expansion later.

Recommended go-order:
1. Better Auth runtime + handler + session helper.
2. Google OAuth flow with redirects and audit logs.
3. OTP flow with full security controls and environment boundaries.
4. Middleware guard + permission resolver enforcement.
5. Full test checklist and integration verification report.

Go/No-Go criteria for Phase 2A closure:
- Auth flows (Google + OTP) pass happy and failure paths.
- Admin/agent/customer route guards behave as specified.
- Permission resolver precedence matches Phase 1D order exactly.
- Audit logging coverage is complete for required events.
- Lint, typecheck, and defined tests pass.