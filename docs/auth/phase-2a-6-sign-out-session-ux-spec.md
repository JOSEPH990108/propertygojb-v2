# Phase 2A.6 Sign Out + Session UX Specification

Date: 2026-06-02
Phase: 2A.6
Scope: Planning/specification only
Status: Draft for implementation planning

References:
- docs/auth/phase-2a-auth-access-integration-spec.md
- docs/auth/phase-2a-5-route-protection-role-guards-spec.md
- docs/auth/phase-2a-5-route-guards-verification-report.md
- src/lib/auth/client.ts
- src/lib/auth/server.ts
- src/lib/auth/session.ts
- src/lib/auth/guards.ts
- src/app/(public)/layout.tsx
- src/app/(public)/page.tsx
- src/app/(internal)/admin/page.tsx
- src/app/(internal)/agent/page.tsx
- src/components/auth/google-auth-card.tsx
- src/components/layout/public-shell.tsx
- src/config/routes.ts
- package.json
- node_modules/better-auth/dist/api/index.d.mts
- node_modules/better-auth/dist/api/routes/sign-out.d.mts

## 1) Objective
Define sign out support for Phase 2A runtime hardening and testability.

This specification defines:
- sign out behavior and flow ownership
- recommended MVP UI placement for sign out access
- safe post-sign-out redirect behavior

This is planning only. No runtime implementation is included in this phase document.

## 2) Current status
Confirmed current status:
- Better Auth sessions are working.
- CUSTOMER phone OTP login/register and session flow are working.
- Route guards are implemented for admin, agent, and auth pages.
- CUSTOMER route guard behavior has partial manual verification completed.
- No sign out UI/action currently exists.
- Admin/Agent full product UI is not ready yet (placeholder dashboards).

## 3) Sign out behavior
Required flow:
1. User clicks Sign out.
2. App invokes Better Auth signOut through supported client or server invocation.
3. Better Auth clears or revokes the active session and updates cookie state.
4. User is redirected to a safe public/auth entry path.

Behavior rules:
- Use Better Auth signOut endpoint behavior as authority.
- Do not manually delete cookies unless required by official Better Auth signOut method.
- Do not manually manipulate session rows.
- Ensure the client does not retain stale authenticated UX state after completion.

Recommended redirect after sign out:
- Redirect to /login.

Rationale:
- /login gives an explicit re-entry point for Google OAuth and OTP.
- It makes route-guard regression testing clearer for internal routes.

## 4) UI placement for MVP
Recommended minimal placement in this phase:
- Prefer adding a minimal authenticated sign out action where authenticated users are guaranteed to see it.
- Use one of these low-risk placements:
  - Temporary sign out button in admin and agent placeholder pages for testing.
  - Small reusable authenticated user action component used by current internal shells.
  - Public/authenticated header placement only if an authenticated header variant already exists.

Current structure notes:
- Public shell currently exposes a Login link in header navigation.
- No authenticated header action pattern is currently wired.

MVP UI guidance:
- Avoid dashboard or navigation redesign in this phase.
- Favor minimal, reversible placement that supports verification.

## 5) Expected implementation files later
Likely files for 2A.6 implementation phase:
- src/components/auth/sign-out-button.tsx
- src/lib/auth/sign-out-client.ts (if helper abstraction is needed)
- src/app/(internal)/admin/page.tsx (only if temporary sign-out test UI is added)
- src/app/(internal)/agent/page.tsx (only if temporary sign-out test UI is added)
- existing public/authenticated header component only if such component already exists

Possible related updates:
- src/config/routes.ts only if a dedicated post-sign-out route constant is needed

## 6) Security rules
Mandatory rules:
- Use Better Auth signOut flow.
- Do not manually create or delete session rows.
- Do not manually clear cookies unless Better Auth official method requires it.
- Do not expose access tokens, refresh tokens, or secrets in UI/logs.
- Do not modify DB schema.
- Do not implement permission resolver in this phase.
- Do not implement admin/agent management UI in this phase.

Additional constraints:
- Keep implementation server-safe and consistent with current guard model.
- Preserve Google OAuth and OTP session compatibility.

## 7) Test checklist
Manual verification checklist for implementation phase:
- login via phone OTP
- click sign out
- redirected to /login
- /admin after sign out redirects to /login?next=%2Fadmin
- /agent after sign out redirects to /login?next=%2Fagent
- /login accessible after sign out
- Google session can sign out
- OTP session can sign out

Execution note:
- Include both Google and OTP initiated sessions in validation scope.

## 8) Exclusions
Out of scope for Phase 2A.6:
- admin/agent user management UI
- profile dropdown full design
- route middleware
- DB schema changes
- migrations
- permission resolver
- dashboard navigation redesign

## 9) Implementation phases
Planned implementation sequence:
- 2A.6.1 sign out button and/or client helper
- 2A.6.2 place minimal sign out UI for testing
- 2A.6.3 sign out verification report

Phase gate guidance:
- Complete 2A.6.1 and 2A.6.2 before deeper dashboard/auth regression testing.
- Close 2A.6 only after 2A.6.3 verification checklist is complete.

## 10) Final recommendation
Implementation can proceed.

Proceeding conditions:
- Keep scope strictly to sign out flow and minimal session UX needed for testing.
- Keep Better Auth signOut as session/cookie authority.
- Avoid unrelated UI redesign and all DB changes.
- Verify both Google and OTP session sign out paths before closing the phase.
