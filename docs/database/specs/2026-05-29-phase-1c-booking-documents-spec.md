# Phase 1C Booking and Documents Specification

Date: 2026-05-29
Scope: Phase 1C planning only
Status: Approved for implementation
References:
- docs/database/implementation-plan.md
- docs/database/decisions/2026-05-28-database-scope-decisions.md
- docs/database/reports/2026-05-28-phase-1a-verification-report.md
- docs/database/reports/2026-05-29-phase-1b-verification-report.md
- docs/database/specs/2026-05-28-phase-1a-core-db-foundation-spec.md
- docs/database/specs/2026-05-29-phase-1b-lead-whatsapp-routing-spec.md

## 1. Phase 1C objective
Phase 1C defines the first-class Booking and Documents database design for MVP execution across external website booking intake, admin portal verification, and agent portal follow-up.

Primary outcomes:
- Booking is modeled as a first-class transaction aggregate from day one.
- Booking relationships to lead, project, and inventory units are explicit and auditable.
- Participant and payment tracking are normalized for practical operational workflows.
- Document request, upload, submission, verification, and access logging workflows are covered.
- File storage reuses the existing Phase 1A files table with no duplicate file registry.

Non-goals:
- End-to-end legal, loan, and compliance automation.
- Full payment gateway and e-signature orchestration.

## 2. Tables included
Required Phase 1C tables:
- bookings
- booking_units
- booking_participants
- booking_status_history
- booking_payments
- booking_activities
- document_types
- document_requests
- document_submissions
- document_verification_logs
- document_access_logs

## 3. Tables excluded
Phase 1C explicit exclusions:
- Full payment gateway integration
- E-signature integration
- Loan approval workflow automation
- SPA/legal workflow automation
- Permission/audit governance tables from Phase 1D
- Referral/reward tables
- Commission/payout tables
- Banker/lawyer modules (except future-scope references)
- Full CRM automation
- Full WhatsApp automation

## 4. Table-by-table field design
Field design follows existing project conventions: text id primary keys, created_at and updated_at, optional deleted_at where soft delete is practical.

Enum design policy:
- Use PostgreSQL/Drizzle enums for lifecycle statuses in Phase 1C instead of free-text status columns.

### 4.1 bookings
Purpose: Primary booking transaction aggregate.

Fields:
- id: text primary key
- leadId: text not null fk -> leads.id
- projectId: text not null fk -> projects.id
- bookingCode: varchar(50) not null
- status: booking_status not null default DRAFT
- bookingChannel: varchar(30) not null (WEBSITE, AGENT_PORTAL, ADMIN_PORTAL)
- submittedByUserId: text nullable fk -> users.id
- assignedAgentUserId: text nullable fk -> users.id
- bookingFeeAmount: numeric(15,2) nullable
- bookingFeeCurrency: varchar(10) not null default MYR
- bookingFeePaidAmount: numeric(15,2) not null default 0
- bookingFeeDueAt: timestamp nullable
- submittedAt: timestamp nullable
- approvedAt: timestamp nullable
- approvedByUserId: text nullable fk -> users.id
- rejectedAt: timestamp nullable
- rejectedByUserId: text nullable fk -> users.id
- rejectionReason: text nullable
- expiredAt: timestamp nullable
- cancelledAt: timestamp nullable
- cancellationReason: text nullable
- metadata: jsonb nullable
- createdAt: timestamp not null default now()
- updatedAt: timestamp not null default now()
- deletedAt: timestamp nullable

### 4.2 booking_units
Purpose: Link bookings to one or more units with reservation facts.

Fields:
- id: text primary key
- bookingId: text not null fk -> bookings.id
- projectId: text not null fk -> projects.id
- unitId: text not null fk -> units.id
- reservedPrice: numeric(15,2) nullable
- bookingFeeAllocatedAmount: numeric(15,2) nullable
- reservationStartedAt: timestamp nullable
- reservationExpiresAt: timestamp nullable
- releasedAt: timestamp nullable
- releaseReason: text nullable
- createdAt: timestamp not null default now()
- updatedAt: timestamp not null default now()

### 4.3 booking_participants
Purpose: Buyer and participant structure for booking ownership.

Fields:
- id: text primary key
- bookingId: text not null fk -> bookings.id
- role: varchar(30) not null (PRIMARY_BUYER, CO_BUYER, GUARANTOR, CONTACT)
- fullName: varchar(200) not null
- phoneE164: varchar(30) nullable
- email: varchar(255) nullable
- nationality: varchar(100) nullable
- identityType: varchar(30) nullable (NRIC, PASSPORT, OTHER)
- identityNoMasked: varchar(60) nullable
- isPrimaryContact: boolean not null default false
- isSignatory: boolean not null default false
- participantOrder: integer not null default 0
- createdAt: timestamp not null default now()
- updatedAt: timestamp not null default now()
- deletedAt: timestamp nullable

### 4.4 booking_status_history
Purpose: Immutable booking status lifecycle trail.

Fields:
- id: text primary key
- bookingId: text not null fk -> bookings.id
- fromStatus: booking_status nullable
- toStatus: booking_status not null
- changedByUserId: text nullable fk -> users.id
- changedAt: timestamp not null default now()
- reasonCode: varchar(50) nullable
- reasonNote: text nullable
- sourceEventType: varchar(40) nullable (MANUAL, SYSTEM, PAYMENT_UPDATE, DOC_VERIFICATION)

### 4.5 booking_payments
Purpose: Booking fee and related payment tracking (without gateway automation).

Fields:
- id: text primary key
- bookingId: text not null fk -> bookings.id
- paymentType: varchar(30) not null (BOOKING_FEE, ADJUSTMENT, REFUND)
- amount: numeric(15,2) not null
- currency: varchar(10) not null default MYR
- paymentMethod: varchar(30) nullable (BANK_TRANSFER, FPX_MANUAL, CASH, CHEQUE, OTHER)
- paymentStatus: payment_status not null
- receivedAt: timestamp nullable
- verifiedAt: timestamp nullable
- verifiedByUserId: text nullable fk -> users.id
- referenceNo: varchar(120) nullable
- proofFileId: text nullable fk -> files.id
- rejectionReason: text nullable
- metadata: jsonb nullable
- createdAt: timestamp not null default now()
- updatedAt: timestamp not null default now()
- deletedAt: timestamp nullable

### 4.6 booking_activities
Purpose: Operational booking timeline for admin, agent, and system actions.

Fields:
- id: text primary key
- bookingId: text not null fk -> bookings.id
- actorUserId: text nullable fk -> users.id
- activityType: varchar(40) not null (NOTE, STATUS_CHANGE, PAYMENT_UPDATE, DOCUMENT_REQUESTED, DOCUMENT_VERIFIED, FOLLOW_UP)
- title: varchar(150) nullable
- body: text nullable
- visibilityScope: varchar(20) not null default INTERNAL
- activityAt: timestamp not null default now()
- metadata: jsonb nullable
- createdAt: timestamp not null default now()

### 4.7 document_types
Purpose: Configurable taxonomy of document requirements.

Fields:
- id: text primary key
- code: varchar(50) not null
- name: varchar(120) not null
- description: text nullable
- category: varchar(40) not null (IDENTITY, INCOME, ADDRESS, FINANCING, OTHER)
- allowedMimePatterns: jsonb nullable
- maxFileSizeBytes: integer nullable
- isMandatoryDefault: boolean not null default false
- isActive: boolean not null default true
- createdAt: timestamp not null default now()
- updatedAt: timestamp not null default now()
- deletedAt: timestamp nullable

### 4.8 document_requests
Purpose: Request documents for a booking and participant with due dates.

Fields:
- id: text primary key
- bookingId: text not null fk -> bookings.id
- participantId: text nullable fk -> booking_participants.id
- documentTypeId: text not null fk -> document_types.id
- requestStatus: document_request_status not null
- requestedByUserId: text nullable fk -> users.id
- requestedAt: timestamp not null default now()
- dueAt: timestamp nullable
- waivedAt: timestamp nullable
- waivedByUserId: text nullable fk -> users.id
- waiveReason: text nullable
- notes: text nullable
- createdAt: timestamp not null default now()
- updatedAt: timestamp not null default now()

### 4.9 document_submissions
Purpose: Uploaded document submissions linked to files table.

Fields:
- id: text primary key
- bookingId: text not null fk -> bookings.id
- requestId: text nullable fk -> document_requests.id
- participantId: text nullable fk -> booking_participants.id
- documentTypeId: text not null fk -> document_types.id
- fileId: text not null fk -> files.id
- submissionStatus: document_submission_status not null
- uploadedByUserId: text nullable fk -> users.id
- uploadedAt: timestamp not null default now()
- versionNo: integer not null default 1
- replacedBySubmissionId: text nullable fk -> document_submissions.id
- notes: text nullable
- createdAt: timestamp not null default now()
- updatedAt: timestamp not null default now()
- deletedAt: timestamp nullable

### 4.10 document_verification_logs
Purpose: Detailed verification decisions and reviewer comments.

Fields:
- id: text primary key
- submissionId: text not null fk -> document_submissions.id
- bookingId: text not null fk -> bookings.id
- verificationStatus: document_verification_status not null
- verifiedByUserId: text nullable fk -> users.id
- verifiedAt: timestamp nullable
- reasonCode: varchar(50) nullable
- reasonNote: text nullable
- checklistJson: jsonb nullable
- createdAt: timestamp not null default now()

### 4.11 document_access_logs
Purpose: Access visibility and audit-style trace for sensitive document reads/downloads.

Fields:
- id: text primary key
- submissionId: text not null fk -> document_submissions.id
- bookingId: text not null fk -> bookings.id
- actorUserId: text nullable fk -> users.id
- accessType: varchar(30) not null (VIEW, DOWNLOAD, SHARE_LINK_CREATED, SHARE_LINK_USED)
- accessAt: timestamp not null default now()
- ipAddress: varchar(64) nullable
- userAgent: text nullable
- sourceContext: varchar(50) nullable (ADMIN_PORTAL, AGENT_PORTAL, SYSTEM)
- createdAt: timestamp not null default now()

## 5. Primary keys and foreign keys
Primary key strategy:
- All Phase 1C tables use text id primary key.

Foreign key linkage to existing modules:
- bookings.leadId -> leads.id
- bookings.projectId -> projects.id
- bookings.submittedByUserId -> users.id
- bookings.assignedAgentUserId -> users.id
- bookings.approvedByUserId -> users.id
- bookings.rejectedByUserId -> users.id

- booking_units.bookingId -> bookings.id
- booking_units.projectId -> projects.id
- booking_units.unitId -> units.id

- booking_participants.bookingId -> bookings.id

- booking_status_history.bookingId -> bookings.id
- booking_status_history.changedByUserId -> users.id

- booking_payments.bookingId -> bookings.id
- booking_payments.verifiedByUserId -> users.id
- booking_payments.proofFileId -> files.id

- booking_activities.bookingId -> bookings.id
- booking_activities.actorUserId -> users.id

- document_requests.bookingId -> bookings.id
- document_requests.participantId -> booking_participants.id
- document_requests.documentTypeId -> document_types.id
- document_requests.requestedByUserId -> users.id
- document_requests.waivedByUserId -> users.id

- document_submissions.bookingId -> bookings.id
- document_submissions.requestId -> document_requests.id
- document_submissions.participantId -> booking_participants.id
- document_submissions.documentTypeId -> document_types.id
- document_submissions.fileId -> files.id
- document_submissions.uploadedByUserId -> users.id
- document_submissions.replacedBySubmissionId -> document_submissions.id

- document_verification_logs.submissionId -> document_submissions.id
- document_verification_logs.bookingId -> bookings.id
- document_verification_logs.verifiedByUserId -> users.id

- document_access_logs.submissionId -> document_submissions.id
- document_access_logs.bookingId -> bookings.id
- document_access_logs.actorUserId -> users.id

## 6. Unique constraints
Recommended uniqueness:
- bookings.bookingCode unique
- booking_units unique(bookingId)
- Only one active unreleased booking_unit per unit at a time. Active means releasedAt is null and booking is not CANCELLED, REJECTED, or EXPIRED. This is enforced as application/transaction logic in Phase 1C.
- booking_participants unique(bookingId, participantOrder)
- document_types.code unique
- document_requests unique(bookingId, participantId, documentTypeId) for open requests (status not in WAIVED)
- document_submissions unique(requestId, versionNo) where requestId is not null

## 7. Index recommendations
Booking indexes:
- bookings(status, createdAt)
- bookings(leadId, createdAt)
- bookings(projectId, status)
- bookings(assignedAgentUserId, status)
- booking_units(unitId)
- booking_units(bookingId, reservationExpiresAt)
- booking_status_history(bookingId, changedAt desc)
- booking_payments(bookingId, paymentStatus)
- booking_payments(referenceNo)
- booking_activities(bookingId, activityAt desc)

Document indexes:
- document_types(isActive, category)
- document_requests(bookingId, requestStatus)
- document_requests(participantId, requestStatus)
- document_submissions(bookingId, submissionStatus)
- document_submissions(requestId, versionNo)
- document_submissions(fileId)
- document_verification_logs(submissionId, createdAt desc)
- document_access_logs(submissionId, accessAt desc)
- document_access_logs(bookingId, accessAt desc)

## 8. Booking status flow
Proposed booking lifecycle:
- DRAFT
- SUBMITTED
- UNDER_REVIEW
- PAYMENT_PENDING
- PAYMENT_VERIFIED
- DOCS_PENDING
- DOCS_VERIFIED
- APPROVED
- REJECTED
- EXPIRED
- CANCELLED

Flow notes:
- DRAFT -> SUBMITTED when customer or agent finalizes initial data.
- SUBMITTED -> UNDER_REVIEW when admin picks up case.
- UNDER_REVIEW branches to PAYMENT_PENDING and DOCS_PENDING as parallel operational checkpoints.
- PAYMENT_VERIFIED and DOCS_VERIFIED are required before APPROVED.
- REJECTED and CANCELLED are terminal operational states for MVP.
- Every transition writes booking_status_history and a booking_activities record.

Reservation policy decisions:
- One booking allows one unit only in MVP.
- reservationExpiresAt default policy is 72 hours after booking submission.
- Phase 1C database scope stores reservationExpiresAt and releasedAt only; auto-release job is not implemented in Phase 1C database work.

## 9. Booking payment flow
1. Booking is created with expected booking fee and due timing.
2. Payment evidence is recorded in booking_payments with status PENDING or RECEIVED.
3. Admin verifies payment proof and updates status to VERIFIED or REJECTED.
4. Verification action writes booking_activities and optionally booking_status_history.
5. booking_fee_paid_amount on bookings can be updated as aggregate projection.

Phase 1C payment scope:
- Manual/offline tracking and verification only.
- No payment gateway orchestration or reconciliation automation.

## 10. Document request and upload flow
1. Admin/agent issues document_requests by booking and optional participant.
2. Customer uploads files through existing files pipeline and links each fileId via document_submissions.
3. Submission status changes to UNDER_REVIEW.
4. Re-submission creates new version and links replacedBySubmissionId where needed.
5. Access events are logged in document_access_logs for sensitive reads/downloads.

## 11. Document verification flow
1. Reviewer opens pending submission.
2. Reviewer validates required checks (type, completeness, readability, policy checks).
3. Reviewer writes document_verification_logs with status VERIFIED or REJECTED and reasons.
4. document_submissions.submissionStatus is updated accordingly.
5. Related document_requests requestStatus and booking status checkpoints are updated.

Verification policy note:
- Document verification status is explicit and auditable.
- Reviewer identity and timestamps are captured.
- Payment proof rejection requires reasonNote; reasonCode remains optional for MVP.

## 12. Admin and agent responsibilities
Admin responsibilities:
- Own booking approval/rejection decisions.
- Verify payments and documents.
- Mark waivers and exceptional overrides with reason capture.

Agent responsibilities:
- Create and follow up bookings.
- Request documents and guide customer submission.
- Add booking activities and operational notes.
- No governance-level permission model introduced in Phase 1C; full RBAC depth remains Phase 1D scope.

Agent-visible activity types:
- follow-up notes
- document requested/submitted status
- payment received/verified status
- booking status change summary

Admin-only activity details:
- rejection reason
- document verification comments
- internal override notes

## 13. Customer privacy and security notes
- Store only practical minimum PII required for booking and verification.
- Avoid storing raw identity numbers in clear form where masked alternatives are sufficient.
- Access to submissions should be role-restricted at application layer.
- Verification notes should avoid unnecessary sensitive data duplication.
- Access events should be logged for sensitive document interactions.

## 14. File storage and linkage rules
- All uploaded document files must link to existing files.id from Phase 1A files table.
- documents module in Phase 1C does not create a separate raw file registry.
- checksum, scan_status, visibility_scope, and uploaded_by_user_id continue to be managed through files.
- document_submissions.fileId is the canonical linkage for submitted artifacts.

Access logging decision:
- Document access logging must cover both VIEW and DOWNLOAD from day one.

## 15. Seed strategy for Phase 1C
Seed goals:
- Provide minimal deterministic baseline for booking/document flow testing.

Recommended Phase 1C seed layers (planning target):
- document_types baseline (identity, income, address, financing).
- optional sample booking + participant + request + submission records gated by explicit dev flags.

Seed principles:
- Idempotent upsert behavior.
- No production credentials.
- No real customer identities or sensitive legal docs.
- Keep optional sample seeds development-only and explicitly gated.

## 16. Migration implementation order
Recommended order:
1. Create bookings.
2. Create booking_units and booking_participants.
3. Create booking_status_history, booking_payments, booking_activities.
4. Create document_types.
5. Create document_requests.
6. Create document_submissions.
7. Create document_verification_logs and document_access_logs.
8. Add uniqueness and query indexes.
9. Apply stricter constraints after initial validation period if needed.

## Enum recommendations
Recommended Phase 1C enums:

- booking_status:
	- DRAFT
	- SUBMITTED
	- UNDER_REVIEW
	- PAYMENT_PENDING
	- PAYMENT_VERIFIED
	- DOCS_PENDING
	- DOCS_VERIFIED
	- APPROVED
	- REJECTED
	- EXPIRED
	- CANCELLED

- payment_status:
	- PENDING
	- RECEIVED
	- VERIFIED
	- REJECTED
	- REFUNDED

- document_request_status:
	- REQUESTED
	- SUBMITTED
	- VERIFIED
	- REJECTED
	- WAIVED

- document_submission_status:
	- SUBMITTED
	- UNDER_REVIEW
	- VERIFIED
	- REJECTED
	- REPLACED

- document_verification_status:
	- PENDING
	- VERIFIED
	- REJECTED

## 17. Risks and edge cases
- Unit double-reservation races under concurrent booking attempts.
- Booking status drift between payment/doc checkpoints and aggregate status.
- Partial participant data leading to downstream legal/document mismatch.
- Repeated document uploads causing version confusion without strong rules.
- Oversharing sensitive files without strict visibility/access controls.
- Payment reference duplication across channels.
- Expired bookings with late payment/document submissions.

Mitigations:
- Transactional checks on booking_units reservations.
- Strict status transition validation rules.
- Versioned submission model with explicit replaced-by links.
- Access logging and least-privilege UI/API gates.

## 18. Final implementation decisions
- Booking status uses PostgreSQL/Drizzle enum, not free-text.
- One booking allows one unit only in MVP.
- reservationExpiresAt default policy is 72 hours after booking submission.
- Auto-release job is not implemented in Phase 1C database work; Phase 1C stores reservationExpiresAt and releasedAt.
- Mandatory document baseline includes:
	1. NRIC / Passport
	2. Proof of income
	3. Bank statement
	4. Booking payment proof
- Agent-visible activity types are limited to follow-up notes, document requested/submitted status, payment received/verified status, and booking status change summary.
- Admin-only activity details include rejection reason, document verification comments, and internal override notes.
- Payment proof rejection requires reasonNote.
- reasonCode remains optional for MVP.
- Document access logging covers both VIEW and DOWNLOAD from day one.
- Banker/lawyer references remain future scope only.

## 19. Final recommendation on Phase 1C readiness
Recommendation: READY FOR IMPLEMENTATION.

Rationale:
- Scope aligns with implementation plan and locked owner decisions.
- Booking and documents are modeled as practical first-class MVP workflows.
- Linkage to existing Phase 1A files and Phase 1B leads is explicit.
- Exclusions are clearly defined to avoid Phase 1D/Phase 2 scope creep.

MVP scope lock note:
- Phase 1C is MVP operational tracking only. It does not implement payment gateway, e-signature, loan approval automation, SPA/legal automation, banker/lawyer modules, or full governance permissions.