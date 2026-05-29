# Phase 2A.4 Better Auth Phone-Number Plugin Compatibility Checkpoint

Date: 2026-05-29
Scope: Documentation and research only
Status: Completed (compatibility assessment)
References:
- docs/auth/phase-2a-4-otp-session-strategy-decision.md
- docs/auth/phase-2a-4-better-auth-session-issuance-notes.md
- docs/auth/phase-2a-4-otp-provider-endpoints-spec.md
- docs/auth/phase-2a-auth-access-integration-spec.md
- src/lib/auth/server.ts
- src/lib/auth/client.ts
- src/lib/auth/session.ts
- src/lib/auth/otp/service.ts
- src/app/api/auth/otp/request/route.ts
- src/db/schema/identity-auth.ts
- src/db/schema/otp.ts
- src/db/schema/audit.ts
- package.json
- package-lock.json
- node_modules/better-auth/dist/plugins/phone-number/index.d.mts
- node_modules/better-auth/dist/plugins/phone-number/types.d.mts
- node_modules/better-auth/dist/api/index.d.mts
- node_modules/better-auth/dist/types/api.d.mts

## 1. Objective
Confirm whether Better Auth phone-number plugin can satisfy this project's Phase 2A OTP requirements before OTP verify implementation starts.

## 2. Selected strategy summary
- Option A is selected: use Better Auth phone-number plugin end-to-end.
- Better Auth should remain the canonical session and cookie issuer.
- OTP verify must not be implemented until this compatibility checkpoint is accepted.

## 3. Better Auth phone-number plugin capabilities found locally
Based on installed local Better Auth package/types:

Plugin configuration options observed:
- otpLength
- sendOTP (required)
- verifyOTP (optional custom verification path)
- sendPasswordResetOTP
- expiresIn
- phoneNumberValidator
- requireVerification
- callbackOnVerification
- signUpOnVerification with getTempEmail/getTempName
- schema
- allowedAttempts

Plugin endpoints/methods observed:
- sendPhoneNumberOTP
- verifyPhoneNumber
- signInPhoneNumber
- requestPasswordResetPhoneNumber
- resetPasswordPhoneNumber

Session behavior from local types:
- verifyPhoneNumber request body includes disableSession flag.
- verifyPhoneNumber response shape includes token when session issuance is enabled.
- This indicates verify can create session by default, with explicit disableSession control.

Hooks/callbacks and customization observed:
- callbackOnVerification exists (post verification callback).
- verifyOTP can delegate OTP verification to custom provider/state.
- sendOTP and phoneNumberValidator are customizable.
- signUpOnVerification indicates plugin can create users after successful phone verification.

Current runtime note:
- src/lib/auth/server.ts currently configures Google social provider only and does not wire phone-number plugin yet.

## 4. Compatibility checklist
### A. CUSTOMER-only public phone registration
Requirement:
- New public phone users must become CUSTOMER only.
- AGENT/ADMIN/SUPER_ADMIN cannot self-register through phone OTP.

Assessment:
- CONDITIONALLY SATISFIABLE.

Reason:
- Plugin supports sign-up-on-verification and verification callbacks, which provides control points.
- Need explicit runtime policy wiring to force CUSTOMER assignment and reject internal-role self-registration paths.

### B. Existing role preservation
Requirement:
- Existing role must be preserved for CUSTOMER/AGENT/ADMIN/SUPER_ADMIN.
- No auto-upgrade or overwrite.

Assessment:
- CONDITIONALLY SATISFIABLE.

Reason:
- Current project already uses Better Auth database hooks for Google role policy.
- Equivalent guard logic must be confirmed for phone plugin flows so existing roles are not overwritten.

### C. Role-based redirect
Requirement:
- CUSTOMER -> /
- AGENT -> /agent
- ADMIN/SUPER_ADMIN -> /admin
- missing/unknown role -> /login?error=unknown-role

Assessment:
- COMPATIBLE (app-layer).

Reason:
- Redirect logic is app-owned and independent of transport.
- Plugin flow must return enough identity/session context to re-use existing redirect mapping logic.

### D. Google OAuth compatibility
Requirement:
- Existing Google OAuth must remain unaffected.

Assessment:
- COMPATIBLE WITH ISOLATION CHECK.

Reason:
- Phone plugin is additive in Better Auth plugin model.
- Need integration check to ensure no regression in current google socialProviders flow and audit behavior.

### E. auth_audit_logs compatibility
Requirement:
- Must still capture OTP_REQUESTED, OTP_SENT, OTP_DELIVERY_FAILED, OTP_VERIFY_SUCCESS, OTP_VERIFY_FAILED, OTP_MAX_ATTEMPTS_LOCKED, OTP_RESEND_BLOCKED, SESSION_CREATED.

Assessment:
- CONDITIONALLY SATISFIABLE.

Reason:
- App can write audit events around plugin endpoint invocation.
- Need explicit event mapping for plugin-managed OTP lifecycle so required event taxonomy remains intact.

### F. Existing otp_challenges/request endpoint responsibility
Requirement:
- Decide whether otp_challenges remains primary state, becomes pre-check/risk/audit layer, or is refactored/deprecated.

Assessment:
- REQUIRES DESIGN DECISION.

Reason:
- Plugin can own OTP generation/verification, but current request endpoint and otp_challenges already implement anti-abuse and lifecycle controls.
- Dual-state risk must be resolved before verify implementation.

## 5. Option A implementation mapping proposal
If Option A proceeds, recommended mapping:

Session issuance:
- Better Auth phone plugin verifyPhoneNumber handles session issuance.
- Use disableSession only for exceptional controlled paths; default should preserve canonical Better Auth session/cookie behavior.

POST /api/auth/otp/request handling:
- Preferred: keep project endpoint as orchestration wrapper that performs policy/risk checks first, then calls plugin sendPhoneNumberOTP.
- Alternative: replace request endpoint with direct plugin call and move policy checks into plugin hooks/callbacks.
- Do not keep two independent OTP state authorities without explicit ownership boundaries.

CUSTOMER role assignment policy:
- Enforce through Better Auth runtime hooks/callbacks on phone verification/sign-up path.
- New public phone registrations must map to CUSTOMER only.
- Internal roles must only come from internal provisioning/governance path.

Audit logging:
- Continue writing auth_audit_logs in application boundary around plugin request/verify calls.
- Keep existing required event names even if underlying plugin flow differs.
- SESSION_CREATED should only be emitted after plugin confirms session creation.

Verify UI integration:
- Verify UI should submit to app verify endpoint/wrapper that calls plugin verifyPhoneNumber (or directly to plugin route only if app wrapper responsibilities are explicitly relocated).
- Redirect decisions remain app-controlled after successful authenticated session + role resolution.

## 6. Incompatibility risks
Primary blockers if not resolved:
- CUSTOMER-only assignment cannot be strictly enforced in phone plugin path.
- Existing role preservation cannot be guaranteed for internal roles.
- Required audit lifecycle events cannot be mapped one-to-one.
- otp_challenges ownership is ambiguous, causing duplicated or conflicting OTP states.
- Redirect rules cannot be consistently applied after plugin flow.

## 7. Final compatibility verdict
CONDITIONALLY COMPATIBLE: minor design decisions needed.

Rationale:
- Local plugin/types show required OTP/session primitives exist.
- Policy-specific behavior (role governance, audit taxonomy, and otp_challenges ownership) still needs explicit implementation decisions before coding verify.

## 8. Recommendation
OTP verify implementation should not start yet.

Start verify implementation only after this mini-design checkpoint is approved:
1. Confirm role policy enforcement design for plugin sign-up/verification path.
2. Confirm audit event mapping for plugin lifecycle.
3. Confirm otp_challenges responsibility model (primary vs pre-check/risk layer vs deprecate).
4. Confirm Google OAuth non-regression test scope.
