# Phase 2A.4 OTP Session Strategy Decision Checkpoint

Date: 2026-05-29
Scope: Documentation and decision checkpoint only
Status: Owner decision recorded; compatibility checkpoint required before implementation
References:
- docs/auth/phase-2a-4-better-auth-session-issuance-notes.md
- docs/auth/phase-2a-4-otp-provider-endpoints-spec.md
- docs/auth/phase-2a-otp-persistence-db-addendum-spec.md
- docs/auth/phase-2a-auth-access-integration-spec.md
- src/lib/auth/server.ts
- src/lib/auth/otp/service.ts
- src/db/schema/otp.ts
- package.json
- package-lock.json
- node_modules/better-auth/dist/plugins/phone-number/index.d.mts
- node_modules/better-auth/dist/api/index.d.mts
- node_modules/better-auth/dist/types/api.d.mts

## 1. Objective
Decide the OTP session issuance strategy for Phase 2A.4.3 so OTP verify can create or continue authenticated Better Auth sessions safely, without bypassing Better Auth cookie and session controls.

## 2. Current blocker summary
- OTP request is implemented with custom lifecycle and safety controls in otp_challenges.
- OTP verify is intentionally blocked until a safe Better Auth-supported session issuance path is selected.
- Current runtime in src/lib/auth/server.ts uses Better Auth core plus Google social login; phone-number plugin is not configured.
- Local Better Auth types confirm auth API/session routes like signInSocial, signInEmail, signUpEmail, getSession, revokeSession, updateSession.
- Local Better Auth types do not confirm a generic public API in current setup for "create session for arbitrary already-verified custom OTP user".
- Local Better Auth package includes phone-number plugin endpoints (signInPhoneNumber, sendPhoneNumberOTP, verifyPhoneNumber), which may provide a first-class issuance path if adopted.

## 3. Option comparison
### Option A: Use Better Auth phone-number plugin end-to-end
Summary:
- Move phone OTP sign-in and session issuance fully to Better Auth phone-number plugin routes.

Session and cookie model:
- Preserved by Better Auth.
- Avoids manual cookie/session implementation.

Strengths:
- Highest alignment with Better Auth-supported auth/session pipeline.
- Lower long-term risk for session invariants and cookie handling.

Risks and open questions:
- Must validate CUSTOMER-only public registration policy support.
- Must validate whether existing role assignment/redirect requirements fit plugin flow.
- Must decide whether otp_challenges remains primary OTP state or becomes only supporting telemetry and anti-abuse store.
- Existing custom OTP request endpoint may become transitional, partially reused, or replaced.

Complexity:
- Medium to high migration complexity from current custom request implementation to plugin-centric flow.

### Option B: Keep custom otp_challenges and build Better Auth-supported custom plugin or endpoint
Summary:
- Keep current custom OTP lifecycle design and integrate a Better Auth-supported extension path for session issuance after OTP verify success.

Session and cookie model:
- Can be preserved only if issuance is done through documented Better Auth extension surface.
- Must not manually set cookies or insert sessions directly.

Strengths:
- Preserves current custom lifecycle controls already implemented in otp_challenges and request service.
- Keeps flexibility for custom anti-abuse, metadata, and audit behavior.

Risks and open questions:
- Requires explicit confirmation of official Better Auth extension method for secure issuance.
- Higher implementation and review complexity.
- Higher schedule risk if extension support or typing surface is ambiguous.

Complexity:
- High.

### Option C: Manual session insert and manual cookie handling
Summary:
- Write session rows directly and set cookies outside Better Auth.

Decision:
- Rejected and not recommended.

Reason:
- Bypasses Better Auth session and cookie model.
- High risk for broken invariants, token/cookie incompatibility, and security regressions.

## 4. Security impact
Option A security impact:
- Strongest default posture if fully plugin-supported.
- Better Auth remains the sole authority for session issuance and cookie lifecycle.

Option B security impact:
- Potentially acceptable only with a verified Better Auth extension contract.
- Requires strict review to avoid accidental bypass.

Option C security impact:
- Unacceptable for current policy baseline.

Shared mandatory controls regardless of selected safe option:
- Session creation only after OTP challenge is atomically consumed and verified.
- No session before OTP success.
- No raw OTP logging.
- OTP_VERIFY_SUCCESS and SESSION_CREATED audit events only after session creation succeeds.
- Missing/unknown role redirects to /login?error=unknown-role.
- New phone users are CUSTOMER only; existing users keep role.

## 5. Database impact
Option A database impact:
- May reduce direct dependency on custom otp_challenges as primary auth flow table.
- Requires explicit decision whether otp_challenges remains in active runtime flow or shifts to secondary risk/audit support.
- No schema change required for this decision checkpoint.

Option B database impact:
- Maintains otp_challenges as primary OTP lifecycle source of truth.
- Keeps current custom request flow compatible with existing table/index strategy.
- No schema change required for this decision checkpoint.

Option C database impact:
- Encourages unsafe direct coupling to session table internals and cookie logic.
- Rejected.

## 6. Impact on already-built otp_challenges and request endpoint
Current built assets:
- otp_challenges table is implemented and migrated.
- OTP request endpoint and request-side service are implemented around otp_challenges.

Option A impact:
- Existing request endpoint may need refactor or deprecation to align with plugin endpoints.
- Some existing logic (normalization, rate limiting, audit conventions) may be adapted or retained as wrappers.
- Requires mapping exercise to avoid duplicate OTP state systems.

Option B impact:
- Existing request endpoint and otp_challenges flow can continue with lower disruption.
- Main new work is safe Better Auth issuance integration at verify stage.

Option C impact:
- Would bypass the intended architecture and create security debt.
- Rejected.

## 7. Recommended decision
Recommended for owner approval: Option A, with an explicit implementation-compatibility checkpoint.

Recommendation rationale:
- Best alignment with Better Auth-supported session and cookie issuance model.
- Lowest long-term session security risk compared with custom issuance ambiguity.
- Keeps architecture coherent if plugin supports policy requirements.

Mandatory checkpoint before coding verify:
- Confirm phone-number plugin can enforce CUSTOMER-only public registration, role handling, and redirect requirements without policy regression.
- Confirm transition plan for existing otp_challenges and OTP request endpoint responsibilities.

Fallback rule:
- If Option A policy fit cannot be proven, move to Option B only after explicit Better Auth extension-path confirmation.

## 8. Final owner decision placeholder
SELECTED OPTION: Option A - Use Better Auth phone-number plugin end-to-end, pending implementation-compatibility checkpoint.

Owner decision notes:
- Option A is selected because Better Auth should remain the canonical session/cookie issuer.
- Do not implement OTP verify yet.
- Before coding, run a compatibility checkpoint to confirm:
	1. Better Auth phone-number plugin can support CUSTOMER-only public phone registration.
	2. Existing AGENT, ADMIN, and SUPER_ADMIN users keep their manually assigned roles.
	3. Google OAuth behavior remains unaffected.
	4. Role-based redirect rules can be preserved.
	5. auth_audit_logs can still capture OTP lifecycle events.
	6. Existing otp_challenges/request endpoint responsibility is clearly mapped:
		 - keep as risk/audit/rate-limit pre-check layer, or
		 - refactor/deprecate if plugin must own OTP state.

Fallback rule:
- If Option A cannot satisfy the policy requirements, do not code verify endpoint.
- Fall back to Option B only after official Better Auth extension/session issuance path is confirmed.
- Option C remains rejected.

## 9. What to do after owner approval
If owner approves Option A:
1. Produce implementation note mapping plugin endpoints to required app behavior (role policy, redirects, audit events).
2. Define transition plan for current request endpoint and otp_challenges responsibility split.
3. Implement Phase 2A.4.3 verify flow only through Better Auth-supported plugin/session issuance.
4. Validate with lint/typecheck and targeted auth integration tests.

If owner approves Option B:
1. Produce explicit Better Auth extension design note proving session issuance path is officially supported.
2. Define integration contract for custom verify endpoint to mint Better Auth sessions without manual cookies.
3. Implement verify only after extension contract is approved.
4. Validate with lint/typecheck and session issuance integration tests.

If owner requests Option C:
1. Reject and escalate due to security policy conflict.
2. Re-open Option A or Option B decision.
