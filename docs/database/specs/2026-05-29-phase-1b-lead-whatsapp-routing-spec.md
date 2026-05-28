# Phase 1B Lead and WhatsApp Routing Specification

Date: 2026-05-29
Scope: Phase 1B planning only
Status: Approved for implementation
References:
- docs/database/implementation-plan.md
- docs/database/decisions/2026-05-28-database-scope-decisions.md
- docs/database/reports/2026-05-28-phase-1a-verification-report.md
- docs/database/specs/2026-05-28-phase-1a-core-db-foundation-spec.md

## 1. Phase 1B objective
Phase 1B defines the database design for lead intake and WhatsApp inbound routing on top of the completed Phase 1A foundation.

Primary outcomes:
- Canonical lead and inquiry capture model.
- Deterministic inbound WhatsApp capture and conversation linkage.
- Queue-based routing and assignment auditability.
- Lead timeline and status lifecycle tracking.
- SLA-ready assignment and response timestamp model.

Phase 1B is documentation and design only. No schema, migration, seed, or environment changes are performed by this document.

## 2. Tables included
Required Phase 1B tables:
- leads
- inquiries
- lead_assignments
- lead_activities
- lead_status_history
- lead_sources
- whatsapp_conversations
- whatsapp_messages
- whatsapp_webhook_events
- whatsapp_delivery_events
- whatsapp_assignment_rules
- whatsapp_agent_queues
- whatsapp_agent_queue_members

## 3. Tables excluded
Explicitly excluded from Phase 1B:
- Full two-way WhatsApp automation
- WhatsApp template automation
- Booking transaction tables
- Document workflow tables
- Permission/audit governance tables
- Referral/reward tables
- Commission/payout tables
- Banker/lawyer tables

## 4. Table-by-table field design
Field types are planning targets and aligned to Drizzle + PostgreSQL.

### 4.1 lead_sources
Purpose: Controlled source taxonomy for attribution and default routing behavior.

Fields:
- id: text primary key
- code: varchar(50) not null
- name: varchar(100) not null
- description: text nullable
- channel: varchar(30) not null (WEB_FORM, WHATSAPP_INBOUND, CALL_IN, WALK_IN, PARTNER)
- isActive: boolean not null default true
- priority: integer not null default 0
- assignmentSlaMinutes: integer nullable
- firstResponseSlaMinutes: integer nullable
- businessHoursJson: jsonb nullable
- createdAt: timestamp not null default now()
- updatedAt: timestamp not null default now()
- deletedAt: timestamp nullable

### 4.2 leads
Purpose: Canonical prospect record.

Fields:
- id: text primary key
- sourceId: text not null fk -> lead_sources.id
- fullName: varchar(150) nullable
- primaryPhoneE164: varchar(30) not null
- primaryPhoneNormalized: varchar(30) not null
- email: varchar(255) nullable
- preferredLanguage: varchar(20) nullable
- nationality: varchar(100) nullable
- desiredPropertyCategoryId: text nullable fk -> property_categories.id
- desiredPropertyTypeId: text nullable fk -> property_types.id
- preferredRegionId: text nullable fk -> regions.id
- preferredAreaId: text nullable fk -> areas.id
- currentStatus: lead_status enum not null default NEW
- currentAssigneeUserId: text nullable fk -> users.id
- currentQueueId: text nullable fk -> whatsapp_agent_queues.id
- firstInquiryAt: timestamp nullable
- lastActivityAt: timestamp nullable
- firstAssignedAt: timestamp nullable
- firstRespondedAt: timestamp nullable
- assignmentDueAt: timestamp nullable
- firstResponseDueAt: timestamp nullable
- closedAt: timestamp nullable
- closedReason: varchar(120) nullable
- metadata: jsonb nullable
- createdAt: timestamp not null default now()
- updatedAt: timestamp not null default now()
- deletedAt: timestamp nullable

### 4.3 inquiries
Purpose: Intake records from web, WhatsApp inbound, and manual channels that attach to existing or newly created lead.

Fields:
- id: text primary key
- leadId: text not null fk -> leads.id
- sourceId: text not null fk -> lead_sources.id
- channel: varchar(30) not null
- externalReference: varchar(150) nullable
- requesterName: varchar(150) nullable
- requesterPhoneE164: varchar(30) nullable
- requesterPhoneNormalized: varchar(30) nullable
- requesterEmail: varchar(255) nullable
- projectId: text nullable fk -> projects.id
- phaseId: text nullable fk -> project_phases.id
- towerId: text nullable fk -> project_towers.id
- layoutId: text nullable fk -> project_layouts.id
- unitId: text nullable fk -> units.id
- messageText: text nullable
- payload: jsonb nullable
- receivedAt: timestamp not null
- createdAt: timestamp not null default now()
- updatedAt: timestamp not null default now()
- deletedAt: timestamp nullable

### 4.4 lead_assignments
Purpose: Assignment and reassignment ledger with routing context and handoff trail.

Fields:
- id: text primary key
- leadId: text not null fk -> leads.id
- fromUserId: text nullable fk -> users.id
- toUserId: text nullable fk -> users.id
- queueId: text nullable fk -> whatsapp_agent_queues.id
- assignedByUserId: text nullable fk -> users.id
- assignmentType: varchar(30) not null (AUTO, MANUAL, REASSIGN, ROUND_ROBIN, ESCALATION)
- reasonCode: varchar(50) nullable
- reasonNote: text nullable
- ruleId: text nullable fk -> whatsapp_assignment_rules.id
- effectiveFrom: timestamp not null default now()
- effectiveTo: timestamp nullable
- isCurrent: boolean not null default true
- createdAt: timestamp not null default now()

### 4.5 lead_activities
Purpose: Lead activity timeline for notes, communication events, and follow-up actions.

Fields:
- id: text primary key
- leadId: text not null fk -> leads.id
- assignmentId: text nullable fk -> lead_assignments.id
- actorUserId: text nullable fk -> users.id
- activityType: varchar(40) not null (NOTE, CALL, WHATSAPP_INBOUND, WHATSAPP_OUTBOUND_MANUAL, FOLLOW_UP, STATUS_CHANGE)
- title: varchar(150) nullable
- body: text nullable
- dueAt: timestamp nullable
- completedAt: timestamp nullable
- visibilityScope: varchar(20) not null default INTERNAL
- metadata: jsonb nullable
- createdAt: timestamp not null default now()

### 4.6 lead_status_history
Purpose: Immutable lead status transition log.

Fields:
- id: text primary key
- leadId: text not null fk -> leads.id
- fromStatus: lead_status enum nullable
- toStatus: lead_status enum not null
- changedByUserId: text nullable fk -> users.id
- changedAt: timestamp not null default now()
- reasonCode: varchar(50) nullable
- reasonNote: text nullable
- sourceEventType: varchar(40) nullable (MANUAL, WEB_INQUIRY, WHATSAPP_INBOUND, SLA_ESCALATION, SYSTEM_RULE)

### 4.7 whatsapp_agent_queues
Purpose: Queue definitions for inbound routing and assignment balancing.

Fields:
- id: text primary key
- code: varchar(50) not null
- name: varchar(100) not null
- description: text nullable
- regionId: text nullable fk -> regions.id
- areaId: text nullable fk -> areas.id
- projectId: text nullable fk -> projects.id
- assignmentStrategy: varchar(30) not null (ROUND_ROBIN, FIXED_OWNER)
- maxQueueDepth: integer nullable
- isActive: boolean not null default true
- createdAt: timestamp not null default now()
- updatedAt: timestamp not null default now()
- deletedAt: timestamp nullable

Phase 1B strategy scope:
- ROUND_ROBIN rotates across enabled queue members based on routing configuration.
- FIXED_OWNER supports deterministic assignment to a configured owner.
- Workload-based strategies (for example LEAST_ACTIVE) are deferred to later phases.

### 4.8 whatsapp_agent_queue_members
Purpose: Queue membership and assignment load controls per agent.

Fields:
- id: text primary key
- queueId: text not null fk -> whatsapp_agent_queues.id
- userId: text not null fk -> users.id
- isActive: boolean not null default true
- weight: integer not null default 1
- sortOrder: integer not null default 0
- maxActiveLeads: integer nullable
- lastAssignedAt: timestamp nullable
- createdAt: timestamp not null default now()
- updatedAt: timestamp not null default now()
- deletedAt: timestamp nullable

Routing semantics:
- isActive means enabled for routing by admin configuration.
- isActive does not represent online/login presence.

### 4.9 whatsapp_assignment_rules
Purpose: Deterministic inbound routing rule set.

Fields:
- id: text primary key
- name: varchar(120) not null
- priority: integer not null
- isActive: boolean not null default true
- triggerChannel: varchar(30) not null default WHATSAPP
- matchSourceId: text nullable fk -> lead_sources.id
- matchRegionId: text nullable fk -> regions.id
- matchAreaId: text nullable fk -> areas.id
- matchProjectId: text nullable fk -> projects.id
- matchLanguage: varchar(20) nullable
- queueId: text nullable fk -> whatsapp_agent_queues.id
- assignToUserId: text nullable fk -> users.id
- fallbackQueueId: text nullable fk -> whatsapp_agent_queues.id
- effectiveFrom: timestamp nullable
- effectiveTo: timestamp nullable
- stopProcessingAfterMatch: boolean not null default true
- createdAt: timestamp not null default now()
- updatedAt: timestamp not null default now()

Project direct-assignment rule:
- Project-specific direct assignment is supported via matchProjectId + assignToUserId.
- This allows all leads for one project to route to one configured agent.

### 4.10 whatsapp_conversations
Purpose: Conversation envelope linked to lead and customer identity.

Fields:
- id: text primary key
- leadId: text nullable fk -> leads.id
- inquiryId: text nullable fk -> inquiries.id
- provider: varchar(30) not null
- channelAccountId: varchar(100) nullable
- providerConversationId: varchar(120) nullable
- customerPhoneE164: varchar(30) not null
- customerPhoneNormalized: varchar(30) not null
- customerDisplayName: varchar(150) nullable
- queueId: text nullable fk -> whatsapp_agent_queues.id
- ownerUserId: text nullable fk -> users.id
- isOpen: boolean not null default true
- firstInboundAt: timestamp nullable
- lastMessageAt: timestamp nullable
- lastInboundAt: timestamp nullable
- lastOutboundAt: timestamp nullable
- closedAt: timestamp nullable
- closedReason: varchar(120) nullable
- createdAt: timestamp not null default now()
- updatedAt: timestamp not null default now()

### 4.11 whatsapp_messages
Purpose: Message-level capture for inbound and manual outbound logging only.

Fields:
- id: text primary key
- conversationId: text not null fk -> whatsapp_conversations.id
- leadId: text nullable fk -> leads.id
- direction: varchar(20) not null (INBOUND, OUTBOUND)
- messageType: varchar(30) not null (TEXT, IMAGE, DOCUMENT, AUDIO, VIDEO, LOCATION, CONTACT, UNKNOWN)
- providerMessageId: varchar(120) nullable
- providerReplyToMessageId: varchar(120) nullable
- textBody: text nullable
- mediaFileId: text nullable fk -> files.id
- mediaMimeType: varchar(100) nullable
- mediaSizeBytes: integer nullable
- sentAtProvider: timestamp nullable
- deliveredAtProvider: timestamp nullable
- readAtProvider: timestamp nullable
- failedAtProvider: timestamp nullable
- failureCode: varchar(80) nullable
- failureReason: text nullable
- payload: jsonb nullable
- createdAt: timestamp not null default now()

### 4.12 whatsapp_webhook_events
Purpose: Raw inbound webhook persistence and idempotency control.

Fields:
- id: text primary key
- provider: varchar(30) not null
- eventType: varchar(80) not null
- eventKey: varchar(150) not null
- providerEventId: varchar(150) nullable
- occurredAtProvider: timestamp nullable
- receivedAtServer: timestamp not null
- signatureValid: boolean nullable
- processingStatus: varchar(30) not null default RECEIVED
- processingAttempts: integer not null default 0
- processingError: text nullable
- nextRetryAt: timestamp nullable
- conversationId: text nullable fk -> whatsapp_conversations.id
- messageId: text nullable fk -> whatsapp_messages.id
- leadId: text nullable fk -> leads.id
- payload: jsonb not null
- createdAt: timestamp not null default now()

### 4.13 whatsapp_delivery_events
Purpose: Delivery/read/failure timeline per message.

Fields:
- id: text primary key
- messageId: text not null fk -> whatsapp_messages.id
- provider: varchar(30) not null
- providerEventId: varchar(150) nullable
- eventType: varchar(40) not null (SENT, DELIVERED, READ, FAILED)
- eventStatus: varchar(40) not null
- occurredAtProvider: timestamp nullable
- receivedAtServer: timestamp not null
- errorCode: varchar(80) nullable
- errorDetail: text nullable
- payload: jsonb nullable
- createdAt: timestamp not null default now()

## 5. Primary keys and foreign keys
Primary key strategy:
- All Phase 1B tables use text id primary key.

Foreign key map summary:
- leads.sourceId -> lead_sources.id
- leads.desiredPropertyCategoryId -> property_categories.id
- leads.desiredPropertyTypeId -> property_types.id
- leads.preferredRegionId -> regions.id
- leads.preferredAreaId -> areas.id
- leads.currentAssigneeUserId -> users.id
- leads.currentQueueId -> whatsapp_agent_queues.id

- inquiries.leadId -> leads.id
- inquiries.sourceId -> lead_sources.id
- inquiries.projectId -> projects.id
- inquiries.phaseId -> project_phases.id
- inquiries.towerId -> project_towers.id
- inquiries.layoutId -> project_layouts.id
- inquiries.unitId -> units.id

- lead_assignments.leadId -> leads.id
- lead_assignments.fromUserId -> users.id
- lead_assignments.toUserId -> users.id
- lead_assignments.queueId -> whatsapp_agent_queues.id
- lead_assignments.assignedByUserId -> users.id
- lead_assignments.ruleId -> whatsapp_assignment_rules.id

- lead_activities.leadId -> leads.id
- lead_activities.assignmentId -> lead_assignments.id
- lead_activities.actorUserId -> users.id

- lead_status_history.leadId -> leads.id
- lead_status_history.changedByUserId -> users.id

- whatsapp_agent_queues.regionId -> regions.id
- whatsapp_agent_queues.areaId -> areas.id
- whatsapp_agent_queues.projectId -> projects.id

- whatsapp_agent_queue_members.queueId -> whatsapp_agent_queues.id
- whatsapp_agent_queue_members.userId -> users.id

- whatsapp_assignment_rules.matchSourceId -> lead_sources.id
- whatsapp_assignment_rules.matchRegionId -> regions.id
- whatsapp_assignment_rules.matchAreaId -> areas.id
- whatsapp_assignment_rules.matchProjectId -> projects.id
- whatsapp_assignment_rules.queueId -> whatsapp_agent_queues.id
- whatsapp_assignment_rules.assignToUserId -> users.id
- whatsapp_assignment_rules.fallbackQueueId -> whatsapp_agent_queues.id

- whatsapp_conversations.leadId -> leads.id
- whatsapp_conversations.inquiryId -> inquiries.id
- whatsapp_conversations.queueId -> whatsapp_agent_queues.id
- whatsapp_conversations.ownerUserId -> users.id

- whatsapp_messages.conversationId -> whatsapp_conversations.id
- whatsapp_messages.leadId -> leads.id
- whatsapp_messages.mediaFileId -> files.id

- whatsapp_webhook_events.conversationId -> whatsapp_conversations.id
- whatsapp_webhook_events.messageId -> whatsapp_messages.id
- whatsapp_webhook_events.leadId -> leads.id

- whatsapp_delivery_events.messageId -> whatsapp_messages.id

## 6. Unique constraints
Required uniqueness and integrity:
- lead_sources.code unique
- leads.primaryPhoneNormalized unique where deletedAt is null
- whatsapp_agent_queues.code unique where deletedAt is null
- whatsapp_agent_queue_members unique(queueId, userId)
- whatsapp_messages.providerMessageId unique where providerMessageId is not null
- whatsapp_webhook_events(provider, eventKey) unique
- whatsapp_delivery_events(messageId, providerEventId) unique where providerEventId is not null
- whatsapp_conversations one open conversation per provider + customerPhoneNormalized:
  unique(provider, customerPhoneNormalized) where isOpen = true
- lead_assignments one current assignment per lead:
  unique(leadId) where isCurrent = true

## 7. Index recommendations
Lead and inquiry indexes:
- leads(currentStatus, updatedAt)
- leads(currentAssigneeUserId, currentStatus)
- leads(currentQueueId, currentStatus)
- leads(sourceId, createdAt)
- inquiries(leadId, receivedAt)
- inquiries(projectId, receivedAt)

Assignment and timeline indexes:
- lead_assignments(leadId, effectiveFrom desc)
- lead_assignments(toUserId, isCurrent)
- lead_status_history(leadId, changedAt desc)
- lead_activities(leadId, createdAt desc)

WhatsApp routing and event indexes:
- whatsapp_assignment_rules(isActive, priority)
- whatsapp_conversations(leadId, isOpen)
- whatsapp_conversations(ownerUserId, isOpen)
- whatsapp_messages(conversationId, createdAt)
- whatsapp_webhook_events(processingStatus, receivedAtServer)
- whatsapp_webhook_events(nextRetryAt)
- whatsapp_delivery_events(messageId, createdAt)

Required queue-member indexes:
- whatsapp_agent_queue_members(queueId, isActive)
- whatsapp_agent_queue_members(userId, isActive)
- whatsapp_agent_queue_members(lastAssignedAt)

## 8. Lead status flow
Lead status enum requirement:
- Use Drizzle/PostgreSQL enum type lead_status.

lead_status enum values:
- NEW
- UNCONTACTED
- ASSIGNED
- CONTACTED
- QUALIFIED
- NURTURING
- APPOINTMENT_SET
- LOST
- SPAM
- CLOSED

Flow rules:
- Intake creates NEW.
- NEW transitions to UNCONTACTED after canonical lead linkage.
- ASSIGNED is set when active owner is set.
- CONTACTED requires first meaningful engagement.
- QUALIFIED and NURTURING represent mid-funnel progression.
- APPOINTMENT_SET is pre-booking operational checkpoint.
- LOST, SPAM, and CLOSED are terminal in Phase 1B.
- Every transition writes lead_status_history and updates leads.currentStatus.

## 9. WhatsApp inbound routing flow
1. Receive inbound webhook and persist raw payload in whatsapp_webhook_events.
2. Validate signature and update processingStatus.
3. Resolve open conversation by provider + customerPhoneNormalized.
4. If no open conversation, create one and link to lead/inquiry as available.
5. Resolve lead by primaryPhoneNormalized.
6. If lead does not exist, create lead and attach inquiry.
7. Persist inbound whatsapp_messages record.
8. Evaluate whatsapp_assignment_rules sorted by priority asc, then id asc.
9. Apply assignment result and write lead_assignments.
10. Append lead_activities timeline event and finalize webhook processing.

Manual outbound rule:
- Phase 1B allows manual outbound WhatsApp logging only.
- No automated outbound template orchestration is included.

## 10. Agent assignment and handoff rules
Assignment policy:
- Auto-assignment uses rules, queue strategy, and enabled queue members.
- Queue strategy in Phase 1B uses ROUND_ROBIN and FIXED_OWNER only.
- ROUND_ROBIN rotates across enabled queue members.
- For project-level ownership, routing supports direct assignment using matchProjectId + assignToUserId.
- If a ROUND_ROBIN queue has no enabled routing members, fallback order is:
  1. fallbackQueueId
  2. default GENERAL queue
  3. leave lead unassigned and create lead activity for manual review

Permission policy:
- Manual reassignment is allowed only for SUPER_ADMIN and ADMIN.
- AGENT can add notes/activities but cannot reassign ownership in Phase 1B.

Handoff rules:
- Reassignment closes previous current assignment and creates a new current assignment row.
- Handoff reason is required for manual reassignment.
- Only one current assignment per lead is permitted.

## 11. SLA fields and response tracking
SLA targets by source:
- WhatsApp inbound:
  assignment due in 5 minutes, first response due in 15 minutes.
- Web form:
  assignment due in 30 minutes, first response due in 4 business hours.

Default business-hours profile for Phase 1B:
- Malaysia time (Asia/Kuala_Lumpur), Monday to Friday, 9:00 AM to 6:00 PM.

Tracking fields:
- leads.assignmentDueAt
- leads.firstResponseDueAt
- leads.firstAssignedAt
- leads.firstRespondedAt
- leads.lastActivityAt

Operational rules:
- SLA due timestamps are computed at inquiry intake and are database-configurable via lead_sources.assignmentSlaMinutes, lead_sources.firstResponseSlaMinutes, and lead_sources.businessHoursJson.
- firstAssignedAt and firstRespondedAt are set once and not overwritten.
- SLA breach workflows may trigger reassignment or escalation activities.

## 12. Data privacy and security notes
- Store normalized identifiers needed for deterministic matching only.
- Treat webhook/message payloads as sensitive operational data.
- Do not store secrets or access tokens in business tables.
- Restrict payload access to authorized operational roles.
- Maintain production retention target for raw webhook payloads at 90 days.
- Keep binary/media payloads in file storage and reference via files linkage.
- Retention execution jobs are not implemented in Phase 1B; Phase 1B stores timestamp fields required for future retention enforcement.

## 13. Seed strategy for Phase 1B
Seed goals:
- Deterministic local/dev baseline for source, queue, and routing behavior testing.

Recommended seed layers:
- lead_sources baseline codes.
- whatsapp_agent_queues baseline queues.
- whatsapp_agent_queue_members baseline member mappings.
- whatsapp_assignment_rules baseline priority rules.
- Optional synthetic lead/inquiry/message/event records for dev verification.

Seed safety:
- Idempotent upsert by stable business keys.
- No production credentials or real customer data.
- Optional samples gated by explicit dev flags.

## 14. Migration implementation order
Recommended sequence:
1. Create enum lead_status.
2. Create lead_sources.
3. Create leads.
4. Create inquiries.
5. Create whatsapp_agent_queues.
6. Create whatsapp_agent_queue_members.
7. Create whatsapp_assignment_rules.
8. Create lead_assignments.
9. Create lead_status_history and lead_activities.
10. Create whatsapp_conversations.
11. Create whatsapp_messages.
12. Create whatsapp_webhook_events.
13. Create whatsapp_delivery_events.
14. Add unique constraints and indexes.

Hardening approach:
- Apply correctness constraints and idempotency uniqueness first.
- Apply performance indexes and retention jobs after baseline validation.

## 15. Risks and edge cases
- Duplicate webhook delivery or late retries.
- Out-of-order delivery/status events.
- Concurrent routing attempts assigning the same lead.
- Queue has no enabled routing members.
- Phone normalization mismatches across channels.
- Reopened conversation when prior isOpen state is stale.
- Excessive webhook table growth without retention enforcement.

Mitigations:
- Idempotency keys and retry scheduling via nextRetryAt.
- Transactional assignment with one-current-assignment constraint.
- Deterministic rule sorting (priority asc, id asc).
- Queue fallback and escalation activity logging.

## 16. Final implementation decisions
- Business hours default for Phase 1B: Malaysia time (Asia/Kuala_Lumpur), Monday to Friday, 9:00 AM to 6:00 PM.
- If a ROUND_ROBIN queue has zero enabled routing members, fallback order is:
  1. fallbackQueueId
  2. default GENERAL queue
  3. leave lead unassigned and create lead activity for manual review
- APPOINTMENT_SET does not auto-transition to CLOSED in Phase 1B; closure remains manual.
- Webhook payload retention execution is not implemented in Phase 1B; Phase 1B stores timestamps needed for future retention jobs.
- SLA policy is database-configurable through lead_sources fields.
- Routing is configuration-based and does not depend on agent online/login status.

## 17. Final recommendation on readiness
Recommendation: READY FOR IMPLEMENTATION.

Readiness rationale:
- Required Phase 1B tables are fully defined, including queue membership.
- Owner decisions are applied for identity matching, conversation uniqueness, enum status model, SLA targets, permissions, and routing tie-break.
- Exclusions remain explicit to prevent scope creep into Phase 1C, Phase 1D, and Phase 2 automation.