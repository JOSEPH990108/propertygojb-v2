# Phase 2A.4 OTP Provider + Endpoints Specification

Date: 2026-05-29
Scope: Planning/specification only
Status: Approved for implementation
References:
- docs/auth/phase-2a-auth-access-integration-spec.md
- docs/auth/phase-2a-otp-persistence-check.md
- docs/auth/phase-2a-otp-persistence-db-addendum-spec.md
- docs/auth/phase-2a-3-otp-schema-verification-report.md
- src/db/schema/otp.ts
- src/db/schema/enums.ts
- src/db/schema/identity-auth.ts
- src/db/schema/audit.ts
- src/lib/auth/server.ts
- src/lib/auth/env.ts
- src/lib/auth/session.ts
- src/app/(auth)/verify-otp/page.tsx
- src/config/routes.ts
- package.json

## 1. Phase 2A.4 objective
Define the implementation specification for:
- OTP provider abstraction
- OTP request endpoint
- OTP verify endpoint
- OTP auth audit logging
- OTP UI flow boundaries

This phase is planning only. No endpoint/provider/UI implementation is included in this task.

## 2. Current status
Current baseline before Phase 2A.4 implementation:
- `otp_challenges` table exists and has been migrated locally.
- Google OAuth flow is implemented separately and functioning independently.
- OTP runtime request/verify behavior is not implemented yet.
- Existing Better Auth `verification` table is not used for OTP challenge state.

## 3. OTP provider abstraction design
### 3.1 Interface
Define a provider contract under auth OTP service boundary:
- `providerName`: stable provider identifier string
- `supportedChannels`: supported channel list (`SMS`, `WHATSAPP`, `DEV_CONSOLE`)
- `environmentGuard(input)`: rejects unsafe environment/provider pairing
- `sendOtp(input)`: sends OTP through provider channel abstraction

Suggested input shape for `sendOtp(input)`:
- `requestId`
- `identifier`
- `phoneE164`
- `channel`
- `otpCode` (raw code, in-memory only)
- `expiresAt`
- `metadata` (safe fields only)

Suggested output shape:
- `{ delivered: boolean, providerMessageId?: string, providerName: string }`

### 3.2 Provider rules
- Development uses `DEV_CONSOLE` provider only.
- UAT/Production must use real provider abstraction.
- `DEV_CONSOLE` must fail closed outside development.
- UAT/Production must require real provider configuration.
- No provider secrets in code/logs/docs.

### 3.3 Provider implementations in scope for planning
- Dev provider adapter: console output in development only.
- Future provider adapter boundary: SMS/WhatsApp adapters plugged in later behind same interface.

## 4. OTP request endpoint design
Endpoint:
- `POST /api/auth/otp/request`

Input:
- phone number
- purpose: `LOGIN` or `REGISTER`
- optional channel preference

Request flow behavior:
1. Normalize phone to Malaysia-first E.164 policy.
2. Validate phone format and request payload.
3. Apply rate limit by phone + IP.
4. Close/lock/consume expired active challenges before creating new active challenge.
5. Enforce active challenge uniqueness (`phoneNormalized + purpose` partial unique index).
6. Create 6-digit OTP.
7. Hash OTP before storing.
8. Create challenge row in `otp_challenges` with:
   - `expiresAt = now + 5 minutes`
   - `resendAvailableAt = now + 60 seconds`
   - `maxAttempts = 5`
   - `channel = DEV_CONSOLE` in development
9. Send OTP through provider abstraction.
10. Write auth audit events:
   - `OTP_REQUESTED`
   - `OTP_SENT`
   - `OTP_DELIVERY_FAILED` when sending fails

Response:
- Uniform safe response (no enumeration leaks).
- No raw OTP in response.
- Request response may return `{ ok: true, identifier: string, resendAvailableAt: string }` only if identifier is opaque/high-entropy and contains no phone/role/user information.
- Challenge identifier may be returned to client for MVP verify flow, but it must be opaque, random, high-entropy, and not guessable.
- Client `channelPreference` is ignored for MVP; server chooses channel by environment/provider policy.
- If production rate-limit provider/config is missing, request endpoint must fail closed.

## 5. OTP verify endpoint design
Endpoint:
- `POST /api/auth/otp/verify`

Input:
- `identifier`
- `otp` code

Verify flow behavior:
1. Load challenge by `identifier`.
2. Validate active state:
   - not consumed
   - not locked
   - not expired
   - attempts below max
3. Compare provided OTP against stored hash.
4. Increment `attemptCount` safely.

On verification failure:
- Increment `attemptCount` atomically.
- If attempts reaches `maxAttempts`, set `lockedAt`.
- Write `OTP_VERIFY_FAILED` or `OTP_MAX_ATTEMPTS_LOCKED`.
- Return uniform safe response: `{ ok: false, message: "Invalid or expired code." }`.
- Do not reveal whether phone/account/code exists.

On verification success:
- Set `consumedAt`.
- Set `verifiedAt`.
- Resolve or create user:
  - new public phone users become `CUSTOMER` only
  - existing users keep existing role
- Create or continue Better Auth session through approved runtime path.
- Write `OTP_VERIFY_SUCCESS` and `SESSION_CREATED`.
- Return verify success response: `{ ok: true, redirectTo: string }`.
- Do not return role key unless needed in a future approved revision.

## 6. Atomic verification strategy
Required atomicity guarantees:
- Verification state transition must be atomic.
- Prevent double-success race conditions.
- Enforce one-time use only.
- Use transaction and conditional update checks.
- Set `consumedAt` and `verifiedAt` in the same successful operation.

Recommended pattern:
- Single conditional update or transaction-scoped read/update lock path where success path commits exactly once.

## 7. Expired active challenge handling
Because active partial unique index ignores `expiresAt`:
- Request flow must close/lock/consume expired active challenges before attempting insert of a new active challenge.

Recommended update logic before insert:
- Find active rows matching `phoneNormalized + purpose` where:
  - `consumedAt is null`
  - `lockedAt is null`
  - `expiresAt <= now`
- Update them to closed state (preferred: set `lockedAt` and include metadata reason `EXPIRED_ACTIVE_CLOSED`).
- Then insert new challenge.

## 8. User creation/linking policy
- Public phone OTP registration creates `CUSTOMER` only.
- `AGENT`, `ADMIN`, `SUPER_ADMIN` cannot self-register via phone OTP.
- Existing users keep existing role.
- Missing/unknown role after verification redirects to `/login?error=unknown-role` or equivalent safe error state.
- No auto role repair during OTP verify.

## 9. Session integration with Better Auth
Preferred approach:
- Use Better Auth as the source of truth for session model/cookies.
- After successful OTP verification, create/continue session through approved Better Auth runtime path.

Locked requirements:
- Better Auth remains canonical session framework.
- OTP verify must create/continue session through a safe Better Auth-supported path.
- Before implementing OTP verify endpoint, confirm exact Better Auth session creation API.
- If session issuance path is unclear, stop and create `docs/auth/phase-2a-4-better-auth-session-issuance-notes.md` instead of guessing.
- Do not bypass Better Auth cookie/session model with custom insecure session writes.

## 10. Auth audit logging
Required events:
- `OTP_REQUESTED`
- `OTP_SENT`
- `OTP_DELIVERY_FAILED`
- `OTP_VERIFY_SUCCESS`
- `OTP_VERIFY_FAILED`
- `OTP_MAX_ATTEMPTS_LOCKED`
- `OTP_RESEND_BLOCKED`
- `SESSION_CREATED`

Required audit metadata constraints:
- `sourceApp = CUSTOMER_PORTAL`
- include provider/channel
- include `requestId`
- safe metadata only
- never log raw OTP

## 11. UI flow
Pages:
- login
- register
- verify-otp

UI boundaries:
- Login/register can initiate OTP request.
- Verify page accepts challenge identifier context.
- Resend must enforce cooldown.
- Error messages must be safe and user-friendly.
- Raw OTP may only appear in development console output, never in UI/API payloads.

## 12. Security controls
Required controls:
- OTP length: 6 digits
- TTL: 5 minutes
- max attempts: 5
- resend cooldown: 60 seconds
- phone/IP rate limiting
- replay protection (one-time use)
- uniform error responses
- phone masking in logs and responses
- no raw OTP storage/logging
- DEV_CONSOLE provider only in development

MVP rate-limit policy lock:
- OTP request: max 3 per normalized phone per 15 minutes
- OTP request: max 10 per IP per 15 minutes
- OTP verify: max 5 attempts per challenge
- resend cooldown: 60 seconds
- OTP TTL: 5 minutes

## 13. Files expected in implementation
Expected create/update in later implementation:
- src/lib/auth/otp/provider.ts
- src/lib/auth/otp/providers/dev-console.ts
- src/lib/auth/otp/hash.ts
- src/lib/auth/otp/phone.ts
- src/lib/auth/otp/policy.ts
- src/lib/auth/otp/service.ts
- src/app/api/auth/otp/request/route.ts
- src/app/api/auth/otp/verify/route.ts
- src/app/(auth)/login/page.tsx
- src/app/(auth)/register/page.tsx
- src/app/(auth)/verify-otp/page.tsx

## 14. Implementation phases
- 2A.4.1 provider abstraction + policy helpers
- 2A.4.2 OTP request endpoint
- 2A.4.3 OTP verify endpoint
- 2A.4.4 UI wiring
- 2A.4.5 audit logging + verification report

## 15. Tests
Required tests:
- phone normalization tests
- OTP hashing tests
- request cooldown tests
- max attempts lock tests
- expired challenge tests
- consumed replay tests
- new CUSTOMER creation test
- existing user role preservation test
- audit event tests

## 16. Exclusions
Out of scope for Phase 2A.4 implementation planning:
- SMS/WhatsApp vendor implementation
- WhatsApp template automation
- email/password login
- route guard implementation
- permission resolver implementation
- DB schema changes unless a new blocker is discovered
- migrations

## 17. Final implementation decisions
Locked decisions:
- Verify success response returns `{ ok: true, redirectTo: string }`.
- API does not return role key to client unless later explicitly required.
- Verify failure response returns uniform safe response `{ ok: false, message: "Invalid or expired code." }`.
- Do not reveal whether phone/account/code exists.
- OTP request response may return `{ ok: true, identifier: string, resendAvailableAt: string }` only if identifier is opaque/high-entropy and contains no phone/role/user information.
- Challenge identifier may be returned to client for MVP verify flow and must be opaque, random, high-entropy, and not guessable.
- Client `channelPreference` is ignored for MVP.
- Server chooses channel by environment/provider policy.
- Development uses `DEV_CONSOLE` provider only.
- UAT/Production must use real provider abstraction.
- `DEV_CONSOLE` fails closed outside development.
- MVP rate-limit policy:
  - OTP request: max 3 per normalized phone per 15 minutes
  - OTP request: max 10 per IP per 15 minutes
  - OTP verify: max 5 attempts per challenge
  - resend cooldown: 60 seconds
  - OTP TTL: 5 minutes
- If production rate-limit provider/config is missing, OTP request endpoint fails closed.
- Better Auth remains canonical session framework.
- OTP verify creates/continues session only through safe Better Auth-supported path.
- Before OTP verify implementation, exact Better Auth session creation API must be confirmed.
- If unclear, create `docs/auth/phase-2a-4-better-auth-session-issuance-notes.md` instead of guessing.
- Public phone OTP registration creates `CUSTOMER` only.
- Existing users keep existing role.
- Missing/unknown role after verification redirects to `/login?error=unknown-role`.
- No auto-repair for missing roles.

## 18. Final recommendation
Phase 2A.4 is approved for implementation.

Execution guidance:
- Start with 2A.4.1 provider abstraction + policy helpers.
- Do not implement OTP verify endpoint until Better Auth session issuance path is confirmed.

---

Planning task compliance notes:
- Documentation-only change.
- No DB schema modifications.
- No migrations.
- No OTP endpoint/provider/UI implementation.
- No route guard/permission resolver implementation.
