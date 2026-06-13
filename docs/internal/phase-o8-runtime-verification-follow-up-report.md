# Phase O8 Runtime Verification Follow-Up Report

Date: 2026-06-13
Phase: O8
Scope: Manual/runtime follow-up for stateful booking/document/whatsapp slices
Status: Completed (with explicit environment constraints)

## 1. Objective
Validate runtime behavior for stateful flows delivered in O6/O7, then feed defects into O8-T03 bug-fix loop.

## 2. Executed Checks
### 2.1 WhatsApp webhook live runtime checks (localhost:3001)
1. Valid payload (new event key)
- Request: POST /api/whatsapp/webhook with eventKey=manual-o8-check-001 and valid customerPhoneE164.
- Result: HTTP 200, ok=true, duplicate=false.
- Returned webhookEventId, leadId, conversationId, messageId, assignment payload.

2. Duplicate payload replay (same event key)
- Request: POST /api/whatsapp/webhook with same eventKey=manual-o8-check-001.
- Result: HTTP 200, ok=true, duplicate=true.
- Returned same persisted webhookEventId and message linkage.

3. Invalid payload (missing customerPhoneE164)
- Request: POST /api/whatsapp/webhook with missing required phone field.
- Result: HTTP 400, code=INVALID_PAYLOAD, message=customerPhoneE164 is required.

### 2.2 Admin role manual transition checks (UI)
1. Booking transition via /admin/bookings
- Before: PAYMENT_VERIFIED
- Action: Move to DOCS_PENDING
- After: DOCS_PENDING

2. Document request transition via /admin/documents
- Before: SUBMITTED
- Action: Move to VERIFIED
- After: VERIFIED

### 2.3 Agent role manual transition checks (UI)
1. Booking transition via /agent/bookings
- Before: DOCS_PENDING
- Action: Move to PAYMENT_PENDING
- After: PAYMENT_PENDING

2. Document request transition via /agent/documents
- Before: VERIFIED
- Action: Move to REQUESTED
- After: REQUESTED

### 2.4 Database evidence snapshot
- bookings.status for phase1c-sample-booking-001: PAYMENT_PENDING.
- document_requests.request_status (same booking context): REQUESTED.
- booking_status_history captured:
	- PAYMENT_VERIFIED -> DOCS_PENDING (admin actor)
	- DOCS_PENDING -> PAYMENT_PENDING (agent actor)
- audit_logs captured action_type=BOOKING_STATUS_UPDATED for both admin and agent actors.
- audit_logs captured action_type=DOCUMENT_REQUEST_STATUS_UPDATED for both admin and agent actors.
- whatsapp_webhook_events captured event_key=manual-o8-check-001 with processing_status=PROCESSED.

### 2.5 Focused automated support checks
Command:
- npm run test -- src/lib/internal/bookings/transitions.test.ts src/lib/internal/documents/transitions.test.ts src/lib/internal/whatsapp/routing.test.ts

Result:
- 3 test files passed
- 15 tests passed
- 0 failed

## 3. Scope Constraints and Notes
- Booking/document sample data required opt-in seed flag:
	- ENABLE_PHASE1C_SAMPLE_BOOKING_DOCUMENTS=true npm run db:seed
- OTP request flow moved to verify screen but did not reliably emit fresh verification rows in this local run; deterministic OTP test values were seeded in verification table for controlled role-switch testing.
- Sign-out UI call returned 403 in this environment during role switching; session table cleanup was used to continue runtime verification.
- Invalid-signature webhook path is currently not applicable because WHATSAPP_WEBHOOK_SECRET is not configured in .env.local.

## 4. Defect Outcome
- No new defects were confirmed in scoped O8 modules (booking/document transition primitives and webhook baseline route/service).
- Known auth/session friction observed during verification remains outside O8 module scope and should be tracked separately.

## 5. Conclusion
O8-T02 verification scope is closed with runtime evidence across webhook, admin transitions, and agent transitions. O8-T03 bug-fix loop is closed with no scoped patch required in this pass.
