# Phase 2A.4.4 OTP Verify Wrapper + Role Redirect Specification

Date: 2026-05-29
Scope: Planning/specification only
Status: Draft for implementation planning
References:
- docs/auth/phase-2a-4-phone-plugin-implementation-mapping.md
- docs/auth/phase-2a-4-better-auth-phone-plugin-compatibility-checkpoint.md
- docs/auth/phase-2a-4-phone-plugin-runtime-notes.md
- docs/auth/phase-2a-4-otp-provider-endpoints-spec.md
- docs/auth/phase-2a-auth-access-integration-spec.md
- src/lib/auth/server.ts
- src/lib/auth/client.ts
- src/lib/auth/session.ts
- src/lib/auth/otp/service.ts
- src/lib/auth/otp/audit.ts
- src/lib/auth/otp/rate-limit.ts
- src/app/api/auth/otp/request/route.ts
- src/app/(auth)/verify-otp/page.tsx
- src/config/routes.ts
- src/config/roles.ts
- src/db/schema/identity-auth.ts
- src/db/schema/audit.ts
- package.json
- package-lock.json
- node_modules/better-auth/dist/plugins/phone-number/index.d.mts
- node_modules/better-auth/dist/plugins/phone-number/types.d.mts
- node_modules/better-auth/dist/client/plugins/index.d.mts
- node_modules/better-auth/dist/api/index.d.mts
- node_modules/better-auth/dist/types/api.d.mts

## 1. Objective
Define Phase 2A.4.4 verify-wrapper behavior, role-based redirect behavior, and auth-audit behavior while preserving Better Auth phone plugin as OTP/session authority.

This document is planning only.
No runtime implementation is included.

## 2. Current status
- Better Auth phone-number plugin runtime wiring is in place.
- OTP request wrapper exists and delegates to Better Auth phone plugin send path.
- OTP verify wrapper endpoint is not implemented yet.
- Better Auth phone plugin `verifyPhoneNumber` is the intended session issuance path.
- Custom session row insertion and manual cookie handling are prohibited.

## 3. OTP verify endpoint design
Endpoint:
- `POST /api/auth/otp/verify`

Input:
- `phoneNumber`
- `code` (OTP)

Explicit constraint:
- Do not use custom `otp_challenges.identifier` for verification.

Behavior:
1. Normalize `phoneNumber` with Malaysia-first E.164 helper.
2. Validate OTP code shape before calling Better Auth plugin.
3. Call Better Auth phone plugin verify path.
4. Do not pass `disableSession: true` unless separately approved.
5. Better Auth must create/continue session.
6. After verify returns success, confirm session via `getSession` using request headers.
7. Resolve canonical role for authenticated user.
8. Return safe contract only:
   - Success: `{ ok: true, redirectTo: string }`
   - Failure: `{ ok: false, message: "Invalid or expired code." }`

## 4. Role redirect rules
Locked redirect mapping:
- CUSTOMER -> `/`
- AGENT -> `/agent`
- ADMIN -> `/admin`
- SUPER_ADMIN -> `/admin`
- Missing/unknown role -> `/login?error=unknown-role`

Implementation note:
- Role lookup should use canonical stored role code/name and map to this redirect table.
- Any unmapped role must use the unknown-role redirect.

## 5. Role policy
Locked policy:
- New public phone users become CUSTOMER only.
- Existing users keep existing role.
- AGENT, ADMIN, SUPER_ADMIN cannot self-register via public phone OTP flow.
- No automatic role repair.
- No auto-upgrade.
- Role assignment remains DB/admin-governance controlled.

## 6. Better Auth integration details
Based on installed local types, intended server verify call shape:

Server call target:
- `auth.api.verifyPhoneNumber(...)`

Intended body:
- `phoneNumber: string`
- `code: string`
- Optional: `disableSession?: boolean` (default behavior should keep session enabled)
- Optional: `updatePhoneNumber?: boolean`

Headers:
- Forward incoming request headers to preserve cookie/session context.
- Include correlation header(s) when available, for example `x-otp-request-id`.

Expected verify response shape from local plugin types:
- Success-like shape includes:
  - `status: boolean`
  - `token: string | null`
  - `user: UserWithPhoneNumber`

Session confirmation rule:
- Do not trust redirect decision from verify response alone.
- Confirm session with:
  - `auth.api.getSession({ headers: request.headers })`
- Session is considered confirmed only when `getSession` returns non-null with `session` and `user`.

Current clarity status:
- Call surface is sufficiently clear from installed local types and current runtime wiring.
- Verify-wrapper coding is not blocked by API shape ambiguity at planning stage.

## 7. Auth audit logging
Required verify-phase events:
- `OTP_VERIFY_SUCCESS`
- `OTP_VERIFY_FAILED`
- `OTP_MAX_ATTEMPTS_LOCKED` (only if Better Auth error detail allows reliable mapping)
- `SESSION_CREATED` only after session confirmation

Rules:
- `sourceApp = CUSTOMER_PORTAL`
- Never log raw OTP
- Safe metadata only
- Include `requestId` when available
- Log masked phone only

Audit timing:
- Write `OTP_VERIFY_SUCCESS` only after plugin verify succeeds.
- Write `SESSION_CREATED` only after `getSession` confirms active session.
- Map plugin failure to `OTP_VERIFY_FAILED` with safe internal reason.

## 8. Error handling
Client response rules:
- Uniform failure payload: `{ ok: false, message: "Invalid or expired code." }`
- Do not reveal if phone/account/code exists.
- Do not expose Better Auth internal error messages/codes to client.

Server logging rules:
- Record safe failure reason for internal observability.
- Avoid leaking sensitive verification context in logs/metadata.

## 9. Google OAuth non-regression
Non-regression lock:
- Do not change Google OAuth configuration.
- Existing Google login/register behavior remains unchanged.
- Google role redirect behavior remains unchanged.

## 10. Files expected in implementation
Expected in later implementation task(s):
- `src/app/api/auth/otp/verify/route.ts`
- `src/lib/auth/otp/verify-service.ts` or extension in `src/lib/auth/otp/service.ts`
- `src/lib/auth/otp/types.ts`
- `src/lib/auth/otp/audit.ts` (if additional verify events/mappers are needed)
- `src/app/(auth)/verify-otp/page.tsx` only in subsequent UI phase unless explicitly approved

## 11. Implementation phases
- 2A.4.4.1 verify-wrapper API only
- 2A.4.4.2 verify UI wiring
- 2A.4.4.3 OTP audit verification report

## 12. Test checklist
- Valid OTP creates Better Auth session.
- Invalid OTP returns uniform failure payload.
- Expired OTP returns uniform failure payload.
- Max attempts behavior follows Better Auth `allowedAttempts = 5`.
- New phone user becomes CUSTOMER.
- Existing CUSTOMER remains CUSTOMER.
- Existing AGENT remains AGENT.
- Existing ADMIN/SUPER_ADMIN remain internal roles.
- Missing/unknown role redirects to login error path.
- Google OAuth flow still works.

## 13. Exclusions
- No custom session insertion.
- No manual cookie handling.
- No custom OTP verification against `otp_challenges`.
- No DB schema changes.
- No migrations.
- No route guards.
- No permission resolver.
- No email/password login.
- No SMS/WhatsApp vendor implementation.

## 14. Final recommendation
Phase 2A.4.4 verify-wrapper implementation can proceed.

Condition:
- Implement strictly through Better Auth phone plugin verify/session path and preserve the locked redirect/audit/security rules in this specification.
