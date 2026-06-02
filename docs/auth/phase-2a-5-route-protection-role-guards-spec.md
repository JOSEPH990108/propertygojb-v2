# Phase 2A.5 Route Protection + Role-Based Guards Specification

Date: 2026-06-02
Scope: Planning/specification only
Status: Draft for implementation planning
References:
- docs/auth/phase-2a-auth-access-integration-spec.md
- docs/auth/phase-2a-4-4-otp-flow-verification-report.md
- docs/auth/phase-2a-4-otp-verify-wrapper-role-redirect-spec.md
- docs/auth/phase-2a-4-phone-plugin-implementation-mapping.md
- src/lib/auth/server.ts
- src/lib/auth/session.ts
- src/lib/auth/client.ts
- src/config/routes.ts
- src/config/roles.ts
- src/app/(auth)/login/page.tsx
- src/app/(auth)/register/page.tsx
- src/app/(auth)/verify-otp/page.tsx
- src/app/(internal)/admin/page.tsx
- src/app/(internal)/agent/page.tsx
- src/app/(public)
- src/db/schema/identity-auth.ts
- src/db/schema/governance-rbac.ts
- src/db/schema/relations.ts
- package.json

## 1) Objective
Define Phase 2A.5 route protection and role-based guard specification for public, auth, customer, agent, admin, and super admin access.

This specification defines:
- role-based redirect behavior
- unauthenticated redirect behavior
- authenticated-user auth-page redirect behavior

This is planning only. No implementation is included in this phase document.

## 2) Current auth status
Confirmed current status:
- Google OAuth is implemented.
- Phone OTP is implemented for CUSTOMER MVP.
- CUSTOMER role redirect is verified.
- Better Auth session is the canonical session source.
- Route guards are not implemented yet.
- Permission resolver or RBAC runtime enforcement is not implemented yet.

## 3) Route groups and access rules
Current app route groups:
- Public group: src/app/(public)
- Auth group: src/app/(auth)
- Internal group: src/app/(internal) with admin and agent areas

### A) Public routes
Examples:
- /
- /(public) pages such as about, projects, contact, book-viewing
- static and public assets

Access rule:
- Everyone can access.

### B) Auth routes
Examples:
- /login
- /register
- /verify-otp

Access rule:
- Unauthenticated users can access.
- Authenticated users should be redirected by role:
  - CUSTOMER -> /
  - AGENT -> /agent
  - ADMIN -> /admin
  - SUPER_ADMIN -> /admin

### C) Customer routes
Current state:
- Dedicated customer-internal route group is not defined yet.

Planned access rule:
- CUSTOMER-only internal routes can be introduced later under explicit route group or path scope.
- Until then, CUSTOMER operates in public route space and auth flow endpoints.

### D) Agent routes
Examples:
- /agent
- /agent/*

Access rule:
- AGENT allowed.
- ADMIN and SUPER_ADMIN optional access only if explicitly approved in policy.
- CUSTOMER denied.
- Unauthenticated -> /login?next=<encoded path>

### E) Admin routes
Examples:
- /admin
- /admin/*

Access rule:
- ADMIN and SUPER_ADMIN allowed.
- AGENT denied unless explicitly approved later.
- CUSTOMER denied.
- Unauthenticated -> /login?next=<encoded path>

## 4) Role redirect rules
Locked redirect mapping:
- CUSTOMER -> /
- AGENT -> /agent
- ADMIN -> /admin
- SUPER_ADMIN -> /admin
- Missing or unknown role -> /login?error=unknown-role

## 5) Session and role resolution
Resolution rules:
- Use Better Auth getSession as session source of truth.
- Resolve canonical role from database by session user id.
- Do not rely only on Better Auth session custom role fields.
- Reuse the verified OTP verify-service role-resolution approach (DB-first, session fallback).
- Missing role is not auto-repaired during guard checks.
- Do not auto-assign CUSTOMER during guard checks.
- No auto-upgrade.

## 6) Middleware vs server helper decision
### Option A: Next.js middleware
Pros:
- Broad centralized path-level redirect handling.
- Early request interception.

Cons:
- Better Auth session and DB role lookup can be constrained by middleware runtime context.
- Edge runtime database dependency risk if forced into edge-only model.
- Complex cookie/session parsing can become brittle.

### Option B: Server layout or page guard helpers
Pros:
- Full server runtime access to Better Auth getSession and DB role lookup.
- Lower risk for canonical role enforcement.
- Easier to keep logic close to protected layouts.

Cons:
- Protection logic must be applied consistently across all protected entry points.

### Option C: Route-specific requireRole helper
Pros:
- Explicit and composable guard checks.
- Good fit for server pages, route handlers, and server actions.

Cons:
- Requires discipline to avoid missing call sites.

Recommended approach:
- Implement server-side guard helpers first for admin and agent layouts or pages.
- Optionally add lightweight middleware later only for basic coarse redirects if runtime support is confirmed safe.
- Avoid edge-runtime DB dependency unless explicitly validated.

## 7) Proposed helper design
Planned helper module:
- src/lib/auth/guards.ts

Planned helper functions:
- getCurrentAuthContext()
- requireAuth()
- requireRole(allowedRoles)
- redirectAuthenticatedUserByRole()
- resolveUserRoleFromDb(userId)

Expected return shape:
- session
- user
- roleCode
- redirectTo

## 8) Layout-level protection plan
Planned protection entry points:
- Admin layout guard in src/app/(internal)/admin/layout.tsx (or equivalent group layout)
- Agent layout guard in src/app/(internal)/agent/layout.tsx (or equivalent group layout)
- Auth layout redirect for authenticated users in src/app/(auth)/layout.tsx if practical

Expected files later:
- src/app/(internal)/admin/layout.tsx and or src/app/(internal)/layout.tsx
- src/app/(internal)/agent/layout.tsx and or src/app/(internal)/layout.tsx
- src/lib/auth/guards.ts
- src/config/routes.ts (only if additional redirect constants are needed)
- src/config/roles.ts (only if role access matrix is expanded)

## 9) Error and redirect behavior
Defined behavior:
- Unauthenticated access to internal routes -> /login?next=<encoded path>
- Authenticated wrong role -> redirect to own role home
- Unknown role -> /login?error=unknown-role
- Avoid leaking internal route details in UI messages

Recommendation lock:
- Use /login?next=<encoded path> for unauthenticated internal access
- Use role-home redirect for authenticated wrong-role access
- Use /login?error=unknown-role for unknown or missing roles

## 10) Security requirements
- Do not trust client-side role checks.
- Server-side guard checks are source of truth.
- Do not expose internal errors in guard responses.
- Do not implement permission-level RBAC checks in this phase.
- No manual session or cookie logic.
- No database schema changes.

## 11) Google OAuth and OTP compatibility
Compatibility requirements:
- Route guards must work for both Google OAuth sessions and phone OTP sessions.
- Google OAuth behavior remains unchanged.
- Phone OTP behavior remains unchanged.
- Existing CUSTOMER redirect behavior remains intact.

## 12) Test checklist
Planned verification checklist for implementation phase:
- unauthenticated /admin redirects to login
- unauthenticated /agent redirects to login
- CUSTOMER cannot access /admin
- CUSTOMER cannot access /agent
- AGENT can access /agent
- AGENT cannot access /admin unless policy allows
- ADMIN can access /admin
- SUPER_ADMIN can access /admin
- authenticated CUSTOMER visiting /login redirects to /
- authenticated AGENT visiting /login redirects to /agent
- authenticated ADMIN visiting /login redirects to /admin
- unknown role redirects to /login?error=unknown-role
- Google session works with guards
- OTP session works with guards

## 13) Exclusions
- No permission resolver implementation
- No RBAC permission checks yet
- No route guards implementation yet
- No middleware implementation yet unless later approved
- No DB schema changes
- No migrations
- No email/password login
- No SMS/WhatsApp provider integration

## 14) Implementation phases
- 2A.5.1 guard helper implementation
- 2A.5.2 admin and agent layout protection
- 2A.5.3 auth page authenticated redirect
- 2A.5.4 verification report and manual test checklist

## 15) Final recommendation
Phase 2A.5 implementation can proceed.

Proceeding conditions:
- Implement server-side guard helpers first, with DB-first role resolution by session user id.
- Keep permission-level RBAC out of scope for this phase.
- Preserve Better Auth as canonical session and cookie issuer.
- Validate non-regression for Google OAuth and phone OTP session flows during verification.
