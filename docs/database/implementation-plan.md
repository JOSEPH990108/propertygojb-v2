# PropertyGo JB v2 Database Implementation Plan

Date: 2026-05-28
Source baseline: docs/database/reviews/2026-05-28-current-base-database-review.md
Scope: Planning only. No schema, migration, seed, or env changes are performed in this document.

## 1. Recommended final database module structure
Proposed bounded-context module structure for v2:

- identity_auth
- catalog
- inventory_sales
- crm_leads
- communications
- booking
- documents
- operations
- governance
- referrals_rewards (optional module)

Recommended physical organization (planning target):

- src/db/schema/identity-auth/*
- src/db/schema/catalog/*
- src/db/schema/inventory-sales/*
- src/db/schema/crm-leads/*
- src/db/schema/communications/*
- src/db/schema/booking/*
- src/db/schema/documents/*
- src/db/schema/operations/*
- src/db/schema/governance/*
- src/db/schema/referrals-rewards/*

Principles:

- Keep project and inventory core from current base.
- Separate transactional workflows (lead, booking, documents, messaging) into first-class modules.
- Keep optional reward/referral scope isolated so it can be deferred safely.

## 2. Which existing reference tables should be kept
Keep with minimal change in v2:

- roles
- users
- session
- account
- verification
- property_categories
- property_types
- tenure_types
- title_types
- lot_types
- unit_positions
- project_statuses
- construction_statuses
- booking_statuses
- appointment_statuses
- financing_types
- buyer_types
- promotion_types
- media_types
- layout_types
- amenities
- tags
- states
- regions
- areas
- files
- developers
- projects
- project_phases
- project_towers
- project_layouts
- units
- unit_status_history
- pricing_snapshots
- project_media
- project_nearby_places
- project_amenities
- project_tags
- panel_lawyers
- panel_bankers
- project_bankers
- appointments
- favorites
- user_preferences

Keep but mark as optional module:

- gift_catalog
- voucher_catalog
- reward_config
- referral_tiers
- referral_rewards
- redemptions

## 3. Which tables should be simplified
Simplify by reducing coupling or tightening constraints:

- projects
- Add publication workflow fields and approval metadata.
- Keep flags but avoid too many overlapping status booleans.

- units
- Keep inventory facts in units.
- Move booking transaction lifecycle to dedicated booking tables.
- Add reservation hold expiry and release metadata.

- tower_facing_groups, tower_stacks, tower_special_floors
- Keep for high-rise chart use cases.
- Add integrity controls and clear import/maintenance rules.

- regions and areas
- Change global slug uniqueness to scoped uniqueness with parent context.

- appointments
- Keep appointment scheduling only.
- Avoid overloading appointments as booking proxy.

- files
- Evolve into secure file registry with checksum, scan status, owner and linkage metadata.

## 4. Which new tables should be added for v2
Add by module:

crm_leads

- leads
- lead_assignments
- lead_activities
- lead_status_history
- inquiries
- lead_sources

communications

- whatsapp_conversations
- whatsapp_messages
- whatsapp_delivery_events
- whatsapp_templates
- whatsapp_webhook_events
- whatsapp_assignment_rules
- whatsapp_agent_queues

booking

- bookings
- booking_units
- booking_participants
- booking_payments
- booking_status_history
- booking_events

documents

- documents
- document_types
- document_requests
- document_submissions
- document_verification_logs
- document_access_logs

governance

- permissions
- role_permissions
- user_permissions
- audit_logs
- auth_audit_logs
- system_settings
- feature_flags

operations

- tasks
- reminders

agent commercial (phase-driven)

- agent_profiles
- agent_project_access
- commission_rules
- commissions
- commission_payouts

## 5. Phase 1 MVP database scope
Phase 1 should prioritize external showcase + core admin + core agent execution.

Phase 1A: Core DB foundation

- identity_auth baseline: users, roles, session, account, verification
- catalog and inventory baseline: projects, layouts, towers, units, pricing snapshots, media, amenities, tags
- geo baseline with parent-scoped slug strategy (region scoped by state, area scoped by region)
- files baseline with security-ready shape planning

Phase 1B: Lead + WhatsApp routing

- leads, lead_assignments, lead_activities, lead_status_history, inquiries
- whatsapp_conversations for inbound capture and lead linkage
- whatsapp_webhook_events and whatsapp_delivery_events for routing and delivery audit
- whatsapp_assignment_rules and queueing support for assignment and handoff tracking
- phase 1 messaging scope is inbound capture, lead creation, assignment, and routing audit

Phase 1C: Booking + documents

- first-class booking model from day one: bookings, booking_units, booking_participants, booking_payments, booking_status_history
- units remain inventory state with booking projection, not the sole transactional source
- documents module with verification lifecycle: documents, document_types, document_requests, document_submissions, document_verification_logs, document_access_logs
- document metadata must include checksum, scan status, verification status, reviewer, timestamps, and practical access logging

Phase 1D: Governance

- permission-level RBAC from day one with small initial permission set: permissions, role_permissions, user_permissions
- audit and controls baseline: audit_logs, auth_audit_logs, system_settings, feature_flags
- admin bootstrap credentials policy: dev-only bootstrap and never hardcoded for production
- reset tooling policy: local/dev only with hard safety guards

Phase 1 deferred:

- Referral rewards module
- Commission and payout module
- Full two-way WhatsApp messaging and template automation
- Deep CMS content expansion beyond minimal project content sections

## 6. Phase 2 database scope
Phase 2 expands optimization, automation, and growth features.

In-scope additions:

- full two-way WhatsApp messaging and template automation
- referrals_rewards module rollout
- advanced commission and payout workflows
- richer external content structures (SEO blocks, FAQs, dynamic landing modules)
- advanced analytics/event tables for funnel and SLA reporting
- policy-driven message routing and queue optimization
- stronger compliance features (retention schedules, legal hold, data export logs)

## 7. Tables required for external showcase website
Required now:

- projects
- developers
- project_phases
- project_towers
- project_layouts
- units (read/projection for availability badges)
- project_media
- amenities
- tags
- project_amenities
- project_tags
- project_nearby_places
- regions
- areas
- states
- inquiries (new)

Recommended additions for content readiness:

- project_content_sections
- project_seo_metadata
- project_faqs
- publish_workflows

## 8. Tables required for admin portal
Required now:

- users
- roles
- permissions
- role_permissions
- user_permissions
- audit_logs
- system_settings
- feature_flags
- projects and related catalog tables
- units and pricing tables
- leads and routing tables
- bookings and payments tables
- documents and verification tables
- whatsapp conversations/messages/delivery tables

## 9. Tables required for agent portal
Required now:

- users
- roles
- agent_profiles
- agent_project_access
- leads
- lead_assignments
- lead_activities
- appointments
- tasks
- reminders
- whatsapp_conversations
- whatsapp_messages
- bookings
- booking_participants
- booking_payments
- documents
- document_requests
- document_submissions

Required by phase:

- Phase 1: all above except advanced commission payout tables.
- Phase 2: commission_rules, commissions, commission_payouts.

## 10. Lead and WhatsApp routing database design
Lead model:

- leads is the canonical prospect record.
- inquiries and whatsapp events create or attach to leads.
- lead_status_history captures funnel progression.
- lead_assignments captures assignment ownership and handoff history.
- lead_activities stores calls, notes, follow-ups, meeting outcomes.

WhatsApp model:

- whatsapp_conversations keyed by channel and customer identifier.
- whatsapp_messages stores inbound payload metadata in Phase 1, with outbound/two-way expansion in Phase 2.
- whatsapp_delivery_events stores provider delivery/read/failure timeline.
- whatsapp_webhook_events stores raw webhook payload audit.
- whatsapp_assignment_rules controls auto-routing.
- whatsapp_agent_queues provides queue-level balancing.

Routing rules:

- On inbound message, resolve existing lead by phone and open conversation.
- If no assignment, route by rule priority then queue policy.
- Persist all routing changes in lead_assignments and audit_logs.

## 11. Booking and document workflow database design
Booking workflow:

- bookings is the transaction aggregate.
- booking_units links unit reservations to booking records.
- booking_participants supports buyer and co-buyer structures.
- booking_payments tracks booking fee and payment state.
- booking_status_history tracks lifecycle changes.
- unit booking status becomes derived projection from active booking state.

Document workflow:

- documents is file registry with ownership and security metadata.
- document_types defines required document taxonomy.
- document_requests maps required documents by workflow stage.
- document_submissions tracks uploads and version/state.
- document_verification_logs records reviewer decisions and timestamps.

Control points:

- Require document completeness gates before key booking status transitions.
- Enforce role-based reviewer permissions on verification actions.

## 12. Auth, role, permission, and audit design
Auth:

- Keep Better Auth core tables unchanged conceptually.
- Add auth_audit_logs for login/security events.

Authorization:

- roles remains coarse role identity.
- permissions defines action keys.
- role_permissions maps default rights.
- user_permissions allows controlled exceptions.

Audit:

- audit_logs records sensitive create/update/delete/assign/approve actions.
- Minimum fields: actor, action, entity, entity_id, before_json, after_json, ip, user_agent, timestamp.

## 13. Migration strategy using Drizzle
Migration strategy by wave:

1. Baseline stabilization
- Freeze current-base reference as read-only baseline.
- Break schema by modules before introducing large workflow changes.

2. Additive migrations first
- Add new tables and nullable FKs.
- Backfill data from existing tables where needed.
- Add indexes after initial data backfill if required for runtime safety.

3. Transition logic
- Introduce dual-write period for booking state where needed.
- Validate parity reports between old status representation and new booking aggregate.

4. Constraint hardening
- Tighten nullability and add check constraints after parity is proven.
- Add scoped unique constraints for geo keys and workflow keys.

5. Deprecation cleanup
- Remove deprecated fields/tables only after stable release window.

## 14. Seed strategy
Seed layers:

- 00_core_lookups
- 01_geo
- 02_catalog_minimum
- 03_demo_projects_optional
- 04_admin_bootstrap_dev_only
- 05_optional_referrals_module

Seed rules:

- Idempotent upsert required for all seeds.
- No hardcoded production-like admin credential.
- Dev bootstrap admin should be opt-in and environment-guarded.
- Keep optional modules in separate seed entry points.
- Admin bootstrap credentials are dev-only and must never be hardcoded for production.

## 15. Risk list
High risks:

- Booking flow ambiguity if units table remains transaction source of truth.
- Missing WhatsApp auditability can break SLA and compliance requirements.
- Weak RBAC granularity can expose sensitive admin actions.
- Unsafe reset script usage outside local contexts.

Medium risks:

- Data integrity drift in high-rise chart structures without stricter constraints.
- Slug uniqueness collisions for geo hierarchy.
- Seed inconsistency due to code vs slug assumptions.

Delivery risks:

- Scope creep from referral and commission modules during MVP timeline.
- Migration complexity if modularization is postponed.

## 16. Owner decisions required before implementation
Locked by owner decision record:

- See docs/database/decisions/2026-05-28-database-scope-decisions.md

Confirmed decisions:

1. Booking is first-class from day one.
2. WhatsApp Phase 1 scope is inbound capture, lead creation, assignment, and routing audit; full two-way and template automation is Phase 2.
3. RBAC is permission-level from day one with a small initial permission set.
4. Geo slugs are parent-scoped, not globally unique.
5. Documents include checksum, scan status, verification status, reviewer, timestamps, and practical access logs.
6. Referral rewards are deferred to Phase 2.
7. Commission and payout are deferred to Phase 2.
8. External content uses minimal CMS-like project content sections for launch.
9. Admin bootstrap credentials are dev-only and never hardcoded for production.
10. Reset scripts are local/dev only with hard safety guards.

---

## Implementation readiness summary
This plan keeps the current strong catalog and inventory foundation while introducing the missing transactional and governance domains required to operate all three PropertyGo JB v2 systems safely and at scale. It is structured for phased delivery with additive Drizzle migrations and controlled risk.