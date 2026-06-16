# Phase 2A.4.3 Phone Plugin Runtime Notes

Date: 2026-05-29
Scope: Runtime wiring clarification

## Better Auth sendOTP callback context
Local type inspection confirms that `GenericEndpointContext` extends Better Call `EndpointContext`, which provides `headers` and `request`.

Practical impact:
- `sendOTP(data, ctx)` can read wrapper-provided headers.
- Correlation headers are supported:
  - `x-otp-request-id`
  - `x-otp-purpose`
- Runtime wiring now reuses these headers when present and falls back safely when not present.

## Policy enforcement location
To prevent direct `/phone-number/send-otp` usage from bypassing controls, OTP request policy now executes inside phone plugin `sendOTP` path:
- provider environment guard (development only for DEV_CONSOLE)
- rate-limit check
- fail-closed tracking write for `OTP_REQUESTED`
- audit events for `OTP_SENT` and `OTP_DELIVERY_FAILED`

This keeps Better Auth as the OTP/session authority while preserving app-level governance controls.
