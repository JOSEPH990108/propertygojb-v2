# Phase 2A.3 OTP Persistence DB Addendum Specification

Date: 2026-05-29
Scope: Planning/specification only
Status: Approved for implementation
References:
- docs/auth/phase-2a-auth-access-integration-spec.md
- docs/auth/phase-2a-otp-persistence-check.md
- docs/database/reports/2026-05-29-post-phase-1-database-closure-integration-readiness-report.md
- docs/database/reports/2026-05-29-phase-1d-verification-report.md
- src/db/schema/identity-auth.ts
- src/db/schema/audit.ts
- src/db/schema/index.ts
- src/lib/auth/server.ts
- src/lib/auth/env.ts
- src/lib/auth/session.ts

## 1. Objective
Define the minimal secure database persistence required for mobile number + OTP login/register in Phase 2A.

Scope is intentionally limited to OTP challenge persistence only. This addendum does not include OTP endpoint implementation, provider implementation, route guards, or permission resolver work.

## 2. Current blocker summary
Current blocker from OTP feasibility review:
- Existing `verification` table supports only `value` and `expiresAt` for OTP-like needs.
- It does not safely support:
  - attempt count
  - consumed/replay protection
  - resend cooldown
  - lockout metadata
  - send counters
  - atomic verification state transitions

Conclusion: OTP implementation remains blocked until a reviewed DB addendum is approved.

## 3. Recommended design option
Preferred option: create a dedicated OTP challenge table instead of overloading Better Auth `verification`.

Why this is safer:
- Concurrency safety: explicit lifecycle fields allow atomic update conditions for verify/consume/lock.
- Auditability: preserves challenge state and reasoned transitions without overloading generic verification records.
- Replay protection: explicit consumed and lock markers are first-class, queryable, and enforceable.
- Future provider support: channel/provider metadata can evolve (SMS/WhatsApp/dev provider) without coupling to Better Auth internals.
- Operational clarity: OTP data remains runtime transactional data with clear ownership.

## 4. Proposed table
Suggested table name:
- `otp_challenges`

## 5. Proposed fields
MVP field set for secure OTP persistence:
- `id`
- `identifier`
- `phoneE164`
- `phoneNormalized`
- `purpose` (enum/text): `LOGIN`, `REGISTER`
- `channel` (enum/text): `SMS`, `WHATSAPP`, `DEV_CONSOLE`
- `otpHash`
- `expiresAt`
- `consumedAt`
- `verifiedAt` (timestamp, nullable)
- `lockedAt`
- `attemptCount`
- `maxAttempts`
- `resendAvailableAt`
- `lastSentAt`
- `sendCount`
- `requestId`
- `ipAddressHash`
- `userAgentHash` or `userAgent` (nullable)
- `userId` nullable FK to `users.id` when known
- `metadata` jsonb
- `createdAt`
- `updatedAt`

Field intent notes:
- `identifier` should be stable per challenge and used in verify payload exchange.
- `phoneNormalized` supports anti-abuse and active challenge uniqueness logic.
- `requestId` supports trace correlation across request/verify/audit.
- Hash fields reduce sensitive data exposure while preserving abuse detection utility.

Lifecycle timestamps:
- `createdAt` = challenge created.
- `lastSentAt` = OTP delivered or DEV_CONSOLE emitted.
- `consumedAt` = challenge can no longer be used.
- `verifiedAt` = OTP successfully verified.
- `lockedAt` = challenge locked after max attempts.
- `expiresAt` = challenge is no longer valid.

## 6. Security rules
Mandatory rules:
- Store OTP hash only, never raw OTP.
- Raw OTP may appear only in development console provider output.
- No raw OTP in DB, logs, docs, or error responses.
- Verification must be atomic.
- Successful verification must set `consumedAt`.
- Consumed, expired, or locked challenges cannot be reused.
- Max attempts must lock the challenge (`lockedAt`).
- Resend must enforce `resendAvailableAt`.
- Error responses must be uniform to reduce phone enumeration risk.

Atomic verification expectation (conceptual):
- Single update where challenge is matched and active:
  - identifier matches
  - not consumed
  - not locked
  - not expired
  - attempts below max
- On success, set `consumedAt` and increment counters as required in one transaction-safe step.

## 7. Recommended indexes and constraints
Recommended indexes:
- Index on (`phoneNormalized`, `createdAt`)
- Index on (`identifier`, `createdAt`)
- Index on (`expiresAt`)
- Index on (`requestId`)

Recommended constraint:
- Partial unique index for active challenge per phone and purpose when practical:
  - one active unconsumed unlocked challenge per (`phoneNormalized`, `purpose`)
  - where `consumedAt` is null and `lockedAt` is null

PostgreSQL partial unique caveats:
- Partial unique indexes enforce uniqueness only for rows that satisfy predicate.
- Expired-but-unconsumed rows may still satisfy predicate unless predicate includes expiry logic or cleanup strategy.
- Predicate cannot directly use volatile time expressions; practical approach is:
  - uniqueness on not consumed and not locked
  - plus runtime checks on `expiresAt`
  - plus periodic cleanup/archival job if needed later.

## 8. Relationship to Better Auth
- Better Auth remains the session/auth framework.
- `otp_challenges` is a supporting table for custom OTP challenge lifecycle only.
- After OTP verify success, the application should create or continue Better Auth session via approved runtime path, or a documented adapter approach if direct API coverage is limited.
- Better Auth core tables (`users`, `session`, `account`, `verification`) should not be modified unless explicitly approved.

## 9. Relationship to auth_audit_logs
OTP request/verify flows should emit these `auth_audit_logs` events:
- `OTP_REQUESTED`
- `OTP_SENT`
- `OTP_DELIVERY_FAILED`
- `OTP_VERIFY_SUCCESS`
- `OTP_VERIFY_FAILED`
- `OTP_MAX_ATTEMPTS_LOCKED`
- `OTP_RESEND_BLOCKED`
- `SESSION_CREATED`

Event payloads should include provider/channel, request correlation (`requestId`), safe metadata, and failure reasons without exposing raw OTP.

## 10. Migration impact
- This addendum requires one small migration in a later implementation task.
- No migration is generated in this planning task.
- No schema file is modified in this planning task.

## 11. Seed strategy
- No baseline seed is needed for `otp_challenges`.
- No sample OTP challenges should be seeded.
- OTP challenges are runtime transactional records only.

## 12. Implementation order after approval
Recommended sequence:
1. Add `otp_challenges` schema table
2. Generate migration
3. Review generated SQL carefully
4. Migrate locally
5. Implement OTP provider abstraction
6. Implement OTP request endpoint
7. Implement OTP verify endpoint
8. Wire verify UI
9. Add auth audit log writes
10. Verify security cases (attempts, lockout, cooldown, replay, expiry, enumeration-safe responses)

## 13. Exclusions
Explicitly out of scope for this addendum:
- OTP provider vendor implementation
- WhatsApp template automation
- SMS billing/provider setup
- email/password login
- route guard implementation
- permission resolver implementation

## 14. Final implementation decisions
Locked decisions for implementation:
- OTP length: 6 digits.
- OTP TTL: 5 minutes.
- Max attempts: 5.
- Resend cooldown: 60 seconds.
- Lockout policy: lock current challenge after max attempts; user must request a new OTP after cooldown.
- Phone normalization: Malaysia-first MVP, normalize to E.164, default Malaysia +60 when local format is provided.
- Initial channel: DEV_CONSOLE first in development.
- UAT/Production must use provider abstraction; SMS/WhatsApp vendor can be plugged later.
- `otp_challenges` is runtime transactional data only; no seed data.
- Do not use existing Better Auth `verification` table for OTP challenge state.

## 15. Final recommendation
Final recommendation:
- OTP DB addendum is required and approved before OTP coding proceeds.

Recommended immediate next step:
- Execute controlled schema implementation for `otp_challenges` only as the first implementation step in Phase 2A.3.

---

Planning task compliance notes:
- Documentation-only change.
- No DB schema files modified.
- No migration generated or executed.
- No seed changes.
- No OTP endpoint/provider/route-guard/permission-resolver implementation.
