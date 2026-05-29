# Phase 2A.4 Better Auth Session Issuance Notes

Date: 2026-05-29
Scope: Research and documentation only
Status: Completed (no runtime changes)
References:
- docs/auth/phase-2a-4-otp-provider-endpoints-spec.md
- docs/auth/phase-2a-auth-access-integration-spec.md
- docs/auth/phase-2a-otp-persistence-db-addendum-spec.md
- src/lib/auth/server.ts
- src/lib/auth/session.ts
- src/lib/auth/client.ts
- src/app/api/auth/[...all]/route.ts
- src/app/api/auth/otp/request/route.ts
- src/lib/auth/otp/service.ts
- src/lib/auth/otp/types.ts
- src/db/schema/identity-auth.ts
- src/db/schema/otp.ts
- node_modules/better-auth/package.json
- node_modules/better-auth/dist/types/api.d.mts
- node_modules/better-auth/dist/api/index.d.mts
- node_modules/better-auth/dist/plugins/phone-number/index.d.mts
- node_modules/better-auth/dist/plugins/custom-session/index.d.mts

## 1. Objective
Confirm how OTP verify can create or continue a Better Auth session after OTP success without implementing unsafe custom session or cookie logic.

## 2. Current OTP flow status
- OTP request endpoint exists at src/app/api/auth/otp/request/route.ts.
- OTP verify endpoint is not implemented yet.
- otp_challenges table exists and is used for OTP request lifecycle.
- Better Auth runtime exists at src/lib/auth/server.ts.
- Google OAuth flow is separate and already creates Better Auth sessions through standard Better Auth routes and cookies.

## 3. Better Auth session API inspection
Local package and type inspection findings:

Observed core server auth routes in better-auth types:
- signInSocial
- signInEmail
- signUpEmail
- signOut
- getSession
- listSessions
- revokeSession
- revokeSessions
- revokeOtherSessions
- updateSession

Evidence:
- node_modules/better-auth/dist/api/index.d.mts exports these routes.
- node_modules/better-auth/dist/types/api.d.mts exposes getSession on auth.api and filters server/http metadata routes for typed API access.

Observed plugin exports relevant to phone and custom session:
- Phone plugin exists and exposes endpoints including signInPhoneNumber, sendPhoneNumberOTP, verifyPhoneNumber.
- Phone plugin verifyPhoneNumber endpoint type includes disableSession option and token/user return shape.
- Custom session plugin customizes getSession payload shape only; it does not expose a generic create-session endpoint for arbitrary verified user issuance.

Evidence:
- node_modules/better-auth/dist/plugins/phone-number/index.d.mts
- node_modules/better-auth/dist/plugins/custom-session/index.d.mts

Current project runtime exposure:
- src/lib/auth/server.ts enables socialProviders.google and nextCookies plugin only.
- No phone-number plugin is currently configured.
- src/lib/auth/session.ts currently uses auth.api.getSession only.

Assessment:
- No clear first-class public API was found for "create session for already-verified custom OTP user" in current runtime configuration.
- Session creation appears tied to supported Better Auth sign-in/plugin flows that also control cookie issuance.

## 4. Candidate session issuance approaches
### Option A: Better Auth supported API or plugin path
Description:
- Use a Better Auth-supported sign-in mechanism that mints session and cookies (for example a plugin-based phone auth flow).

Safety:
- Safe (if implemented through documented Better Auth plugin or route flow).

Cookie and session model:
- Preserves Better Auth cookie/session model.
- Avoids custom insecure cookie handling.

Complexity:
- Medium to high depending on plugin fit with existing otp_challenges lifecycle.

Current suitability for this project:
- Not yet confirmed for current custom otp_challenges verify design.
- Phone plugin exists in package types but is not wired in current runtime and may not match existing OTP challenge table behavior without additional design decisions.

### Option B: Better Auth custom endpoint or plugin extension approach
Description:
- Implement a Better Auth plugin or endpoint extension that issues sessions through Better Auth internals (not direct DB writes).

Safety:
- Potentially safe if done fully through Better Auth documented extension surfaces.

Cookie and session model:
- Can preserve Better Auth session and cookie model if extension path is officially supported end-to-end.

Complexity:
- High.

Current suitability for this project:
- Not confirmed from current project runtime and inspected local types.
- Requires explicit implementation design and validation against Better Auth extension guidance.

### Option C: Manual session row insert plus manual cookie setting
Description:
- Insert into session table directly and hand-roll cookie headers.

Safety:
- Risky and not recommended.

Cookie and session model:
- High risk of bypassing Better Auth invariants and cookie signing/rotation behavior.
- Does not guarantee compatibility with Better Auth internals.

Complexity:
- Medium technically, high security and maintenance risk.

Current suitability for this project:
- Not recommended.

## 5. Hard rule
- Do not manually insert sessions and hand-roll cookies unless Better Auth documentation and types clearly support that pattern.
- Do not bypass Better Auth session and cookie model.
- If no safe session issuance path is confirmed, OTP verify endpoint must remain blocked.

## 6. Recommended approach
NOT CONFIRMED: OTP verify implementation must pause until Better Auth custom auth and session method is confirmed for custom otp_challenges verification flow.

Reason:
- Current runtime does not expose a confirmed generic create-session API for arbitrary already-verified user context.
- Available phone plugin routes are present in package types but are not currently wired and may not align with current custom OTP persistence design without further decisions.

## 7. Impact on Phase 2A.4.3 OTP verify endpoint
Because session issuance path is not yet confirmed for the custom verify flow:
- OTP verify coding should not proceed yet.
- Required follow-up decisions before coding:
  - Decide whether to adopt Better Auth phone-number plugin end-to-end for OTP sign-in/verification, or keep custom otp_challenges verify flow.
  - If keeping custom otp_challenges verify flow, confirm an official Better Auth-supported issuance mechanism that sets cookies correctly without manual session/cookie handling.
  - Confirm expected auth.api method or plugin extension contract to be used in verify endpoint implementation.
  - Confirm audit event timing around OTP_VERIFY_SUCCESS and SESSION_CREATED relative to final session issuance success.

## 8. Security requirements
These remain mandatory for OTP verify implementation once session issuance path is confirmed:
- Session creation only after OTP is consumed and verified atomically.
- No session creation before OTP success.
- No raw OTP in logs.
- Write OTP_VERIFY_SUCCESS and SESSION_CREATED audit events only after successful session creation.
- Missing or unknown role must redirect to /login?error=unknown-role.
- New phone users are CUSTOMER only.
- Existing users keep role.

## 9. Final verdict
Ready to implement OTP verify endpoint: NO
Reason:
- Safe Better Auth-supported session issuance path for current custom otp_challenges verify flow is not yet confirmed in current runtime setup.
