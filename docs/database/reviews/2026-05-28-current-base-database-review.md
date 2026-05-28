# PropertyGo JB v2 Database Review (Current Base)

Date: 2026-05-28
Scope: Review based only on the current base reference files:
- docs/database/reference/current-base/index.reference.ts.txt
- docs/database/reference/current-base/reset.reference.ts.txt
- docs/database/reference/current-base/schema.reference.ts.txt
- docs/database/reference/current-base/seeds/basic.reference.ts.txt
- docs/database/reference/current-base/seeds/new-projects.reference.ts.txt

## 1. Overall database design summary
The current design is a strong, ambitious relational foundation for a property platform. It is especially solid for:
- Project catalog and inventory modeling
- Lookup normalization and status workflows
- Better Auth baseline integration
- Appointment and referral mechanics

Suitability verdict for PropertyGo JB v2:
- Suitable as a foundation, but not yet fully suitable as final v2 production schema for all 3 systems.
- The schema is currently strongest for property catalog + booking inventory operations.
- Key missing capabilities exist around lead management, WhatsApp conversation routing, document workflows, auditable admin operations, and agent commercial flows.

## 2. Tables/entities identified
Main entities identified in schema:

- Core lookups: property_categories, property_types, tenure_types, title_types, lot_types, unit_positions, project_statuses, construction_statuses, booking_statuses, appointment_statuses, financing_types, buyer_types, promotion_types, media_types, layout_types
- Taxonomy: amenities, tags
- Panels: panel_lawyers, panel_bankers
- Geography/files: states, regions, areas, files
- Project hierarchy: developers, projects, project_phases, project_towers, tower_facing_groups, tower_stacks, tower_special_floors, project_layouts, units, unit_status_history, pricing_snapshots
- Sales/marketing: inventory_items, sales_packages, package_inventory
- Referral/rewards catalogs: gift_catalog, voucher_catalog, reward_config, referral_tiers
- Auth/users: roles, users, session, account, verification
- Operations: appointments, referral_rewards, redemptions, user_preferences
- Project content: project_media, favorites, project_nearby_places
- Join tables: project_amenities, project_tags, project_bankers

## 3. Strengths of the current schema
- Good normalization for reusable lookup data and statuses.
- Flexible property hierarchy supports both landed and high-rise models.
- Unit-level inventory design is strong and practical for sales operations.
- Good use of join tables for many-to-many links (amenities, tags, bankers).
- Thoughtful indexing on major filtering dimensions (project status, type, region, tower-floor-stack).
- Better Auth baseline tables already aligned (users, session, account, verification).
- Audit-friendly pattern exists for unit status transitions (unit_status_history).
- Seed scripts are mostly idempotent via upsert patterns.

## 4. Weaknesses or over-complicated parts
- Overloaded monolith schema file: very large single schema encourages coupling and higher migration risk.
- Some domains feel premature for v2 MVP (full referral reward catalog/tiers) relative to missing core CRM pipeline entities.
- Inconsistent data strategy between strict lookups and free-text fields (for example unit facing can be free text).
- Chart-specific tables (tower_facing_groups, tower_stacks, tower_special_floors) are useful, but add significant complexity; governance rules are needed.
- Some uniqueness strategy can cause practical collisions (global slugs for regions/areas).

## 5. Missing tables or missing fields
High-priority missing entities for v2:

- Lead management:
  - leads (source, campaign, channel, intent, budget, timeline, status)
  - lead_assignments (routing, ownership, handoff history)
  - lead_activities (calls, WhatsApp, notes, follow-ups)
  - lead_status_history
- WhatsApp routing and conversation:
  - whatsapp_conversations
  - whatsapp_messages
  - whatsapp_templates
  - whatsapp_delivery_events / webhooks log
  - whatsapp_agent_queue / assignment rules
- Booking transaction domain:
  - bookings (separate from unit status), with lifecycle and monetary snapshot
  - booking_participants (buyer, co-buyer)
  - booking_payments (fee, receipt, status)
- Document domain:
  - document_types
  - document_requests
  - document_submissions
  - document_verification_logs
  - entity-level document attachments (booking/customer/project/unit)
- Admin controls and compliance:
  - audit_logs (who, what, before/after)
  - system_settings / feature_flags
  - activity_logs for sensitive operations
- Agent commercial operations:
  - agent_profiles (if user fields are insufficient)
  - agent_project_access
  - commissions / payouts / commission_rules

Important missing fields in existing tables:
- projects: publication workflow fields (published_at, unpublished_at, approved_by, approval_status)
- units: reservation expiry/hold metadata
- appointments: channel/source, cancellation reason, reminder status
- files: checksum, scan_status, storage_bucket, uploaded_by, entity_type/entity_id if polymorphic

## 6. Relationship review
What is good:
- Core FK wiring is mostly coherent.
- Many-to-many relations are modeled correctly for project metadata.
- Cascading delete is used selectively in some critical paths.

Relationship risks/gaps:
- Slug uniqueness for regions and areas is global, not scoped (state/region scoped uniqueness is often safer).
- Some references do not define explicit onDelete behavior; behavior may be inconsistent across domain boundaries.
- towerStacks.facingGroupKey is not enforced by FK against tower_facing_groups key+tower scope, so chart integrity can drift.
- appointments has userId, agentId, referrerId all to users without additional integrity constraints/business rule checks.
- No explicit booking entity means appointments and unit status are carrying process meaning that should be separated.

## 7. Better Auth compatibility review
Current compatibility status:
- Compatible with Better Auth core table expectations (users, session, account, verification).
- Seed shows credential creation with Better Auth hashPassword, which aligns with adapter usage.

Gaps to plan for:
- No built-in auth event audit model (login attempts, lockouts, suspicious activity).
- No MFA/2FA domain tables if required by compliance or admin policy.
- Role model exists, but RBAC granularity is limited (role-per-user only; no permission matrix).

Recommendation:
- Keep current auth tables.
- Add permission and audit extensions as separate modules, not by overloading users.

## 8. Admin portal database requirements
Required for admin portal readiness:
- Fine-grained RBAC: permissions, role_permissions, user_permissions override.
- Full audit trail for content, pricing, assignment, and reward actions.
- Workflow/approval tables for publish states and bulk import validation.
- Operational dashboards need event-like tables (lead funnel events, booking events, WhatsApp delivery outcomes).
- System configuration table for tunable business rules.

Current schema status:
- Partially ready (roles and operational core exist), but lacks governance/audit and admin workflow depth.

## 9. Agent portal database requirements
Required for agent productivity and accountability:
- Assigned lead queues and routing history.
- Interaction logs per lead/customer.
- Appointment outcomes + follow-up tasks.
- Agent-specific inventory visibility/rules.
- Commission and conversion tracking.

Current schema status:
- Not fully ready. Appointment and user basics exist, but CRM + assignment + commission backbone is missing.

## 10. External showcase website database requirements
Required for public website:
- Rich published project content with SEO metadata, hero blocks, USP sections, FAQs.
- Project publish workflow and schedule controls.
- Public media curation/versioning.
- Inquiry capture mapped to lead intake source attribution.

Current schema status:
- Catalog is good (projects/layouts/media/tags/amenities).
- Missing CMS-like content structures and inquiry-to-lead pipeline link.

## 11. Booking flow review
Observed:
- Unit booking state is represented by units.bookingStatusId + unit_status_history.
- No first-class bookings table.

Risks:
- Difficult to model concurrent booking attempts, expiry windows, and payment references cleanly.
- Harder to audit commercial events (who booked, when deposit paid, why cancelled).
- Business logic may become tightly coupled to unit table updates.

Recommendation:
- Introduce bookings as a transaction aggregate and keep units as inventory state projection.

## 12. Document upload flow review
Observed:
- Generic files table and project_media support project assets well.

Gaps for operations:
- No document ownership context for customer KYC/booking/legal docs.
- No verification lifecycle (pending/approved/rejected) and reviewer trace.
- No virus scan/checksum/retention fields.

Recommendation:
- Add document module with typed document lifecycle and polymorphic linking strategy.

## 13. WhatsApp/lead routing review
Observed:
- No dedicated leads or WhatsApp conversation tables.
- Current schema cannot support robust omnichannel routing and conversation audit.

Impact:
- Cannot reliably assign, reassign, and report lead response SLA.
- Cannot tie WhatsApp thread state to conversion funnel and booking outcomes.

Recommendation:
- Add lead + messaging domain with assignment queues, message logs, webhook statuses, and SLA timestamps.

## 14. Seed data review
Strengths:
- Uses transaction blocks and mostly idempotent upsert patterns.
- Good baseline lookup and location population.
- Helpful baseline projects for testing views and listing logic.

Issues:
- Hardcoded master admin default password in seed is a security and operational risk.
- Inconsistent key assumptions in seed logic (code vs slug lookups) can silently produce null references.
- Some upserts only update name, leaving other fields stale across re-seeds.
- Seed scope mixes core baseline + extensive business catalog (rewards), which may be too broad for initial bootstrap.

Recommendation:
- Split seeds by responsibility: core-lookups, geo, demo-projects, optional-reward-module, local-dev-admin.

## 15. Reset script safety review
Observed reset behavior:
- Drops entire public schema with CASCADE and recreates it.

Risk level: High
- No production guardrails.
- No environment confirmation prompt.
- No explicit database name allowlist/denylist.

Recommendation:
- Restrict destructive reset to local/dev only with hard guards and explicit confirmation checks.
- Keep reset script outside normal CI/CD paths.

## 16. Migration strategy recommendation
Recommended strategy:

1) Baseline freeze
- Freeze current-base as reference baseline.
- Modularize schema by bounded context before adding major domains.

2) Domain-first migration waves
- Wave A: Core catalog/inventory cleanup (projects, units, chart integrity constraints)
- Wave B: CRM + leads + WhatsApp routing
- Wave C: Booking transactions + payments + documents lifecycle
- Wave D: Admin governance (RBAC permissions, audit logs, workflow approvals)
- Wave E: Agent commercial (commissions, payout)

3) Data quality controls
- Add check constraints/enums (or strict lookup governance) for lifecycle fields.
- Add scoped unique constraints for geo and business keys.

4) Backward-safe rollout
- Additive migrations first, backfill, dual-write if needed, then deprecate old paths.

## 17. Security risks
High:
- Default seeded admin credential (predictable password pattern risk).
- Reset script can fully wipe schema without strong environment guard.

Medium:
- Lack of centralized audit tables for sensitive operations.
- Document/file model lacks integrity and malware-scan metadata.

Low to medium:
- Potential over-permissive role model without per-action authorization data.

## 18. Recommended final database structure for v2
Recommended bounded-context structure:

- identity_auth
  - users, roles, permissions, role_permissions, session, account, verification, auth_audit_logs
- catalog
  - developers, projects, project_phases, project_towers, project_layouts, project_media, amenities, tags, nearby_places
- inventory_sales
  - units, unit_status_history, pricing_snapshots, sales_packages, package_inventory
- crm_leads
  - leads, lead_assignments, lead_activities, lead_status_history, inquiries
- communications
  - whatsapp_conversations, whatsapp_messages, whatsapp_delivery_events, message_templates
- booking
  - bookings, booking_units, booking_participants, booking_payments, booking_status_history
- documents
  - documents, document_types, document_requests, document_submissions, document_verifications
- operations
  - appointments, tasks, reminders
- referrals_rewards (optional module)
  - reward_config, referral_tiers, referral_rewards, redemptions, gift_catalog, voucher_catalog
- governance
  - audit_logs, system_settings, feature_flags

Design principle:
- Keep current strong project/unit core.
- Move process-heavy workflows (lead, booking, documents, messaging) into first-class transactional tables.

## 19. Questions requiring owner decision before implementation
1. Is v2 phase-1 expected to include full referral rewards, or should it be deferred behind core lead/booking/document domains?
2. Should booking be a first-class aggregate now, or continue with unit status-only flow in phase-1?
3. What is the required WhatsApp scope at launch: inbound capture only, or full two-way thread + template send + delivery audit?
4. Are geo slugs intended to be globally unique, or scoped by parent (state/region)?
5. Do you require strict RBAC (permission-level) from day one, or role-only initially?
6. What compliance level is required for document handling (malware scan, retention, PII audit, deletion policy)?
7. Should agent commission tracking be in v2 phase-1 or phase-2?
8. For external website content, do you want database-driven CMS sections now, or static/MD content first?
9. Is reset script intended only for local development? If yes, can production execution be blocked by hard checks?
10. Should seed include any default admin credential at all, or must admin bootstrap be manual/one-time secure flow?

---

## Decision-ready conclusion
The current base is a good technical starting point and can be retained as v2 foundation. However, for PropertyGo JB v2 to support all 3 systems robustly, the schema should be extended with dedicated lead/WhatsApp, booking, document, governance, and agent-commercial domains before production rollout.