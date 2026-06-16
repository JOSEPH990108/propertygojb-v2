# Phase 2A.4 Phone Plugin Implementation Mapping (Decision Lock)

Date: 2026-05-29
Scope: Documentation-only decision lock before OTP verify implementation
Status: Decision lock completed
References:
- docs/auth/phase-2a-4-better-auth-phone-plugin-compatibility-checkpoint.md
- docs/auth/phase-2a-4-otp-session-strategy-decision.md
- docs/auth/phase-2a-4-otp-provider-endpoints-spec.md
- docs/auth/phase-2a-4-better-auth-session-issuance-notes.md
- src/lib/auth/server.ts
- src/lib/auth/otp/service.ts
- src/app/api/auth/otp/request/route.ts
- src/db/schema/otp.ts
- src/db/schema/identity-auth.ts
- package.json
- package-lock.json
- node_modules/better-auth/dist/plugins/phone-number/index.d.mts
- node_modules/better-auth/dist/plugins/phone-number/types.d.mts

## 1. Objective
Convert the compatibility checkpoint outcome into an implementation mapping for Option A, with explicit decision locks required before Phase 2A.4.3 OTP verify coding starts.

## 2. Selected direction
Locked decisions:
- Better Auth phone-number plugin is the primary OTP and session authority for phone OTP authentication flows.
- Better Auth remains the canonical session and cookie issuer.
- Manual session row insertion and manual cookie issuance remain rejected.
- Any flow that bypasses Better Auth session issuance is out of policy and cannot be implemented.

## 3. otp_challenges responsibility
Locked model:
- otp_challenges is retained as a pre-check, risk-control, and audit-tracking support layer.
- otp_challenges is not the authoritative OTP verification engine once Better Auth phone plugin owns OTP verification/session issuance.
- Existing custom OTP request implementation must not evolve into a competing verification state authority.

Implication:
- The application may keep request-side controls (normalization, cooldown signaling, rate-limit gates, audit context), but final OTP verification truth and session issuance must come from Better Auth phone plugin verify/session path.

## 4. Current custom OTP request endpoint decision
Decision:
- Keep the app endpoint as a wrapper for policy, rate-limit, and audit boundaries, then invoke Better Auth phone plugin send flow where safely supported.

Locked constraints:
- Wrapper behavior must not create a parallel independent verification authority.
- Wrapper is allowed to perform request-level controls and telemetry.
- Wrapper must defer OTP code delivery/verification authority to plugin-owned mechanisms.

Alternative handling rule:
- If direct safe wrapper invocation to plugin send flow is not supportable in runtime boundary, stop implementation and document blocker before coding verify.

## 5. Role policy enforcement
Locked policy:
- New public phone users become CUSTOMER only.
- AGENT, ADMIN, and SUPER_ADMIN cannot self-register via phone OTP.
- Existing user roles must be preserved.
- No automatic role repair or implicit role mutation for missing role states.
- Unknown or missing role after authentication redirects to /login?error=unknown-role.

Policy enforcement expectation:
- Role constraints must be enforced through Better Auth-supported plugin hooks/callbacks or equivalent approved app boundary around plugin flow.
- Google flow role behavior remains independent and unchanged.

## 6. Audit mapping
Required events:
- OTP_REQUESTED
- OTP_SENT
- OTP_DELIVERY_FAILED
- OTP_VERIFY_SUCCESS
- OTP_VERIFY_FAILED
- OTP_MAX_ATTEMPTS_LOCKED
- OTP_RESEND_BLOCKED
- SESSION_CREATED

Event mapping lock:
- App-wrapper domain events:
  - OTP_REQUESTED
  - OTP_SENT
  - OTP_DELIVERY_FAILED
  - OTP_RESEND_BLOCKED
- Verification outcome events in plugin-driven verify lifecycle:
  - OTP_VERIFY_SUCCESS
  - OTP_VERIFY_FAILED
  - OTP_MAX_ATTEMPTS_LOCKED
- Session event rule:
  - SESSION_CREATED is emitted only after Better Auth session issuance is confirmed successful in plugin-supported flow.

Logging safety constraints:
- No raw OTP values in logs.
- Keep sourceApp and safe metadata requirements from existing auth audit policy.

## 7. Verify endpoint implementation rule
Hard implementation rule:
- Do not implement custom session issuance.
- Verify must call a Better Auth phone plugin-supported verify/session path.
- SESSION_CREATED audit must be written only after Better Auth confirms session creation.
- If plugin API cannot be safely called from the app wrapper, stop implementation and document blocker rather than adding workaround session logic.

## 8. Google OAuth non-regression scope
Non-regression lock:
- Google OAuth configuration remains unchanged.
- Existing Google customer flow must continue to work.
- No role behavior changes are allowed for Google OAuth flow.
- Phone plugin integration must be additive and isolated from existing Google route behavior.

## 9. Implementation recommendation
Recommendation:
- Phase 2A.4.3 may proceed after this mapping, under the locked rules in this document.

Execution gate for proceeding:
1. Wire verify through Better Auth phone plugin session path only.
2. Preserve locked role-policy outcomes and redirect behavior.
3. Preserve required audit event taxonomy and session-created timing rule.
4. Stop and document blocker immediately if safe plugin invocation path is not available at implementation time.

## 10. Final verdict
APPROVED FOR IMPLEMENTATION

Rationale:
- Compatibility checkpoint already concluded CONDITIONALLY COMPATIBLE.
- This mapping resolves the remaining decision locks for authority boundaries, role policy, audit mapping, and verify/session constraints.
- Implementation may proceed only within the locked controls above.
