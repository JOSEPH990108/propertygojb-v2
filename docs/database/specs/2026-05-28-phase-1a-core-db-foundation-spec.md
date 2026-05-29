# Phase 1A Core DB Foundation Specification

Date: 2026-05-28
Scope: Phase 1A only
References:
- docs/database/implementation-plan.md
- docs/database/decisions/2026-05-28-database-scope-decisions.md
- docs/database/reviews/2026-05-28-current-base-database-review.md
- docs/database/reference/current-base/schema.reference.ts.txt
- docs/database/reference/current-base/index.reference.ts.txt
- docs/database/reference/current-base/seeds/basic.reference.ts.txt

## 1. Phase 1A objective
Phase 1A establishes the production-ready database foundation for PropertyGo JB v2 before workflow-heavy modules (Phase 1B/1C/1D).

Primary outcomes:
- Stable identity and Better Auth-compatible baseline.
- Core property catalog and inventory baseline for external showcase and internal browsing.
- Geo baseline with parent-scoped slug uniqueness.
- Files baseline with security-ready metadata structure.
- Seed baseline split into safe, predictable layers (including dev-only admin bootstrap plan).

Non-goals for Phase 1A:
- Lead, WhatsApp routing, booking aggregate, document workflow operations, and governance permissions implementation.

## 2. Tables included
Phase 1A includes the following tables.

identity_auth baseline:
- roles
- users
- session
- account
- verification

lookup baseline for catalog and inventory dependencies:
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
- media_types
- layout_types
- buyer_types

catalog and inventory baseline:
- developers
- projects
- project_phases
- project_towers
- project_layouts
- units
- pricing_snapshots
- project_media
- amenities
- tags
- project_nearby_places
- project_amenities
- project_tags

geo baseline:
- states
- regions
- areas

files baseline:
- files

## 3. Tables excluded from Phase 1A
Explicitly excluded to keep Phase 1A focused.

phase 1B and later:
- leads
- lead_assignments
- lead_activities
- lead_status_history
- inquiries
- whatsapp_conversations
- whatsapp_messages
- whatsapp_delivery_events
- whatsapp_webhook_events
- whatsapp_assignment_rules
- whatsapp_agent_queues

phase 1C and later:
- bookings
- booking_units
- booking_participants
- booking_payments
- booking_status_history
- documents
- document_types
- document_requests
- document_submissions
- document_verification_logs
- document_access_logs

phase 1D and later:
- permissions
- role_permissions
- user_permissions
- audit_logs
- auth_audit_logs
- system_settings
- feature_flags

deferred to phase 2:
- gift_catalog
- voucher_catalog
- reward_config
- referral_tiers
- referral_rewards
- redemptions
- commissions and payouts domain tables

excluded from phase 1A despite existing in current-base reference:
- tower_facing_groups
- tower_stacks
- tower_special_floors
- unit_status_history
- inventory_items
- sales_packages
- package_inventory
- favorites
- user_preferences
- appointments
- project_bankers
- panel_bankers
- panel_lawyers

## 4. Table-by-table field design
This section defines Phase 1A table shape. "Existing" means kept from current-base reference. "Phase 1A adjustment" means required design change or addition in Phase 1A.

### 4.1 identity_auth baseline
roles (existing)
- id, code, name, description, is_active, sort_order, created_at, updated_at, deleted_at
- phase 1A adjustment: none

users (existing)
- id, name, email, email_verified, image, phone_number, phone_number_verified, nationality, onboarding_completed, role_id, ren_number, agency_name, referral_code, referred_by_user_id, created_at, updated_at
- phase 1A adjustment: keep referral_code nullable for future compatibility; do not seed or activate referral rewards in Phase 1A

session (existing Better Auth)
- id, expires_at, token, created_at, updated_at, ip_address, user_agent, user_id
- phase 1A adjustment: none

account (existing Better Auth)
- id, account_id, provider_id, user_id, access_token, refresh_token, id_token, access_token_expires_at, refresh_token_expires_at, scope, password, created_at, updated_at
- phase 1A adjustment: none

verification (existing Better Auth)
- id, identifier, value, expires_at, created_at, updated_at
- phase 1A adjustment: none

### 4.2 lookup baseline
property_categories (existing)
- id, code, name, description, color, icon, sort_order, is_active, timestamps
- note: optional slug may be introduced later; not required for Phase 1A DB readiness

property_types (existing)
- id, code, slug, name, description, color, icon, sort_order, is_active, category_id, timestamps

tenure_types (existing)
- id, code, name, metadata fields via lookup helper, timestamps

title_types (existing)
- id, code, name, metadata fields, timestamps

lot_types (existing)
- id, code, name, eligibility, metadata fields, timestamps

unit_positions (existing)
- id, code, name, metadata fields, timestamps

project_statuses, construction_statuses, booking_statuses, appointment_statuses (existing)
- id, code, name, description, color, icon, sort_order, is_active, timestamps

media_types, layout_types, buyer_types (existing)
- id, code, name, description, metadata fields, timestamps

### 4.3 geo baseline
states (existing)
- id, name, slug, country, timestamps
- phase 1A adjustment: keep unique(slug)

regions (existing plus required change)
- id, state_id, slug, name, description, is_active, timestamps
- phase 1A adjustment: replace global unique(slug) with unique(state_id, slug)

areas (existing plus required change)
- id, region_id, slug, name, description, is_active, timestamps
- phase 1A adjustment: replace global unique(slug) with unique(region_id, slug)

### 4.4 files baseline
files (existing plus required phase 1A planning fields)
- existing fields: id, provider, key, url, mime_type, size, created_at, updated_at, deleted_at
- phase 1A required additions:
- bucket (varchar)
- checksum (varchar, SHA-256 recommended)
- scan_status (varchar; recommended values: PENDING, CLEAN, INFECTED, ERROR)
- uploaded_by_user_id (fk to users.id)
- visibility_scope (varchar; recommended values: PUBLIC, INTERNAL, RESTRICTED)
- optional phase 1A extensions: access_policy jsonb, original_file_name, scan_checked_at
- phase 1A decisions:
- checksum is nullable at creation because checksum and scanning may be asynchronous
- url is nullable cached URL; provider + bucket + key is the source of truth

### 4.5 catalog and inventory baseline
amenities (existing)
- id, slug, name, description, icon, is_active, timestamps

tags (existing)
- id, slug, name, description, is_active, timestamps

developers (existing)
- id, slug, name, legal_name, country_code, is_featured, logo_file_id, is_active, timestamps

projects (existing with phase 1A baseline only)
- id, slug, name, description, is_active, display_name, legal_name, developer_id
- property_category_id, property_type_id, project_status_id
- tenure_type_id, title_type_id, tenure_expiry_date
- region_id, area_id, address, latitude, longitude
- land_area_acres, booking_fee, booking_fee_bumi, maintenance_fee_per_sqft, sinking_fund_per_sqft
- is_foreigner_eligible, foreigner_eligibility
- is_gated_community, green_certification
- total_units, launch_year, featured_file_id, is_hot_deal, is_published
- timestamps
- phase 1A adjustment: no new publish workflow fields yet; those are Phase 1D+ workflow scope

project_phases (existing)
- id, project_id, name, phase_code, completion_date, construction_status_id, timestamps

project_towers (existing)
- id, project_id, phase_id, tower_number, name, floor_count, floor_min, floor_max, timestamps

project_layouts (existing)
- id, project_id, code, name, layout_type_id, built_up_sqft, bedrooms, bathrooms, study_rooms
- has_balcony, has_yard, is_dual_key, ceiling_height_m, furnishing_status
- floor_plan_file_id, virtual_tour_url, timestamps

units (existing)
- id, project_id, layout_id, tower_id, phase_id, unit_no, floor, stack, street_name, display_sequence
- built_up_sqft, land_area_sqft, dimension_text, facing, position_type_id
- carpark_count, carpark_lot_no, carpark_type
- lot_type_id, booking_status_id
- base_price, final_price
- timestamps
- phase 1A note: booking_status_id is mandatory and seeded with default AVAILABLE status; first-class booking remains Phase 1C

pricing_snapshots (existing)
- id, project_id, phase_id, tower_id, layout_id, buyer_type_id, view_key
- spa_price_min, spa_price_max, nett_price_min, nett_price_max, rebate_percent_total
- snapshot_date, source_note, timestamps

project_media (existing)
- id, project_id, file_id, media_type_id, caption, sort_order, timestamps

project_nearby_places (existing)
- id, project_id, name, category, distance_km, sort_order, timestamps

project_amenities (existing join)
- project_id, amenity_id

project_tags (existing join)
- project_id, tag_id

project_bankers and panel_bankers
- deferred from strict Phase 1A scope

## 5. Primary keys and foreign keys
Primary key pattern:
- Most tables: text id primary key (UUID default from app layer or DB function)
- Join tables: composite primary keys

Core foreign keys:
- users.role_id -> roles.id
- users.referred_by_user_id -> users.id (on delete set null)
- session.user_id -> users.id (on delete cascade)
- account.user_id -> users.id (on delete cascade)

- property_types.category_id -> property_categories.id
- regions.state_id -> states.id
- areas.region_id -> regions.id

- developers.logo_file_id -> files.id
- projects.developer_id -> developers.id
- projects.property_category_id -> property_categories.id
- projects.property_type_id -> property_types.id
- projects.project_status_id -> project_statuses.id
- projects.tenure_type_id -> tenure_types.id
- projects.title_type_id -> title_types.id
- projects.region_id -> regions.id
- projects.area_id -> areas.id
- projects.featured_file_id -> files.id

- project_phases.project_id -> projects.id
- project_phases.construction_status_id -> construction_statuses.id
- project_towers.project_id -> projects.id
- project_towers.phase_id -> project_phases.id

- project_layouts.project_id -> projects.id
- project_layouts.layout_type_id -> layout_types.id
- project_layouts.floor_plan_file_id -> files.id

- units.project_id -> projects.id
- units.layout_id -> project_layouts.id
- units.tower_id -> project_towers.id
- units.phase_id -> project_phases.id
- units.position_type_id -> unit_positions.id
- units.lot_type_id -> lot_types.id
- units.booking_status_id -> booking_statuses.id

- pricing_snapshots.project_id -> projects.id
- pricing_snapshots.phase_id -> project_phases.id
- pricing_snapshots.tower_id -> project_towers.id
- pricing_snapshots.layout_id -> project_layouts.id
- pricing_snapshots.buyer_type_id -> buyer_types.id

- project_media.project_id -> projects.id (on delete cascade recommended)
- project_media.file_id -> files.id
- project_media.media_type_id -> media_types.id

- project_nearby_places.project_id -> projects.id (on delete cascade recommended)

- project_amenities.project_id -> projects.id
- project_amenities.amenity_id -> amenities.id
- project_tags.project_id -> projects.id
- project_tags.tag_id -> tags.id

## 6. Unique constraints
Required uniqueness in Phase 1A:

identity:
- roles.code unique
- users.email unique
- users.phone_number unique (nullable unique)
- users.referral_code unique (nullable unique)
- session.token unique

lookups:
- property_categories.code unique
- property_types.code unique
- property_types.slug unique
- tenure_types.code unique
- title_types.code unique
- lot_types.code unique
- unit_positions.code unique
- project_statuses.code unique
- construction_statuses.code unique
- booking_statuses.code unique
- appointment_statuses.code unique
- media_types.code unique
- layout_types.code unique
- buyer_types.code unique
- amenities.slug unique
- tags.slug unique

geo (parent scoped):
- states.slug unique
- regions(state_id, slug) unique
- areas(region_id, slug) unique

catalog:
- developers.slug unique
- projects.slug unique
- project_phases(project_id, name) unique
- project_phases(project_id, phase_code) unique (where phase_code is not null)
- project_towers(project_id, tower_number) unique (where tower_number is not null)
- project_layouts(project_id, code) unique
- units(project_id, unit_no) unique

joins:
- project_amenities(project_id, amenity_id) composite pk
- project_tags(project_id, tag_id) composite pk

files:
- recommended unique(provider, bucket, key)
- optional unique(checksum, size, mime_type) is not enforced in Phase 1A (risk of false dedup); keep as indexed candidate

## 7. Index recommendations
Keep existing high-value basic indexes and add targeted Phase 1A baseline indexes first.

Phase 1A indexing policy:
- apply only baseline indexes required for correctness and common query paths
- do not add partial published-project indexes in Phase 1A; evaluate in later optimization wave

identity and auth:
- users(role_id)
- users(created_at)
- account(provider_id, account_id)
- session(user_id)
- session(expires_at)

geo:
- regions(state_id)
- areas(region_id)
- regions(state_id, slug) supporting parent-scoped uniqueness
- areas(region_id, slug) supporting parent-scoped uniqueness

projects and catalog:
- projects(is_published)
- projects(property_category_id)
- projects(property_type_id)
- projects(project_status_id)
- projects(region_id)
- projects(area_id)
- projects(developer_id)
- projects(launch_year)
- project_phases(project_id)
- project_towers(project_id)
- project_towers(phase_id)
- project_layouts(project_id)

units and pricing:
- units(project_id)
- units(tower_id)
- units(layout_id)
- units(booking_status_id)
- units(tower_id, floor, stack)
- pricing_snapshots(project_id)
- pricing_snapshots(phase_id)
- pricing_snapshots(tower_id)
- pricing_snapshots(layout_id)
- pricing_snapshots(snapshot_date)
- pricing_snapshots(project_id, phase_id, tower_id, layout_id, buyer_type_id, snapshot_date)

media and tags:
- project_media(project_id)
- project_nearby_places(project_id)
- project_nearby_places(project_id, category)

files:
- files(provider, bucket, key)
- files(scan_status)
- files(uploaded_by_user_id)
- files(visibility_scope)

## 8. Parent-scoped geo slug design
Decision alignment:
- region slug unique within state
- area slug unique within region

Implementation intent for Phase 1A:
- Replace global region slug unique with composite unique(state_id, slug)
- Replace global area slug unique with composite unique(region_id, slug)
- Keep state slug globally unique

Query patterns supported:
- Resolve region by state slug + region slug
- Resolve area by state slug + region slug + area slug
- Prevent cross-state/cross-region slug collisions without forcing artificial naming

Seed compatibility considerations:
- Upsert targets for regions and areas should move from slug-only to parent-scoped composite keys

## 9. Better Auth compatibility notes
Current compatibility baseline is acceptable for Phase 1A:
- users, session, account, verification tables match Better Auth data model usage
- credential provider is represented by account.provider_id = credential path

Phase 1A notes:
- No structural breaking changes to Better Auth tables in Phase 1A
- Keep id/text strategy consistent across users/session/account/verification
- Keep cascading deletes from users to session/account

Out of scope in Phase 1A:
- auth_audit_logs and advanced auth security controls (Phase 1D)

## 10. File security metadata design
files table in Phase 1A should be extended to become security-ready.

Required metadata fields:
- provider
- bucket
- key
- url
- mime_type
- size
- checksum
- scan_status
- uploaded_by_user_id
- visibility_scope

Recommended semantics:
- scan_status: PENDING, CLEAN, INFECTED, ERROR
- visibility_scope: PUBLIC, INTERNAL, RESTRICTED
- checksum: SHA-256 hex string
- checksum can be null at creation and backfilled asynchronously
- url is an optional cached URL; provider + bucket + key remains the canonical storage locator

Security behavior assumptions (planning only):
- New uploads start scan_status = PENDING
- Files should not be treated as publicly consumable by default when visibility is restricted
- Access events should be logged once documents module is active (Phase 1C)

## 11. Seed design for Phase 1A
Phase 1A seed must be split and safe.

Seed layers:
- 00_core_lookups
- 01_geo
- 02_catalog_minimum
- 03_demo_projects_optional
- 04_admin_bootstrap_dev_only

Rules:
- All seeds must be idempotent
- Avoid mixing optional/deferred business domains in baseline seeds
- No production hardcoded credentials
- Admin bootstrap is dev-only, explicit, and environment-guarded

Phase 1A baseline seed content:
- roles
- core lookup dictionaries
- Johor geo baseline
- minimal developers/projects/layouts/units for smoke testing
- booking_statuses must include AVAILABLE and units seed must reference AVAILABLE as default

Explicitly excluded from Phase 1A seeds:
- referral reward catalogs and reward config
- any production credential defaults

Demo seed policy:
- demo project seed is disabled by default
- demo project seed is enabled only via explicit flag

## 12. Migration implementation order
Recommended execution order for Phase 1A.

1. Identity baseline
- create roles, users, session, account, verification

2. Lookup baseline
- create all required lookup tables for phase 1A dependencies

3. Geo baseline
- create states, regions, areas
- apply parent-scoped unique constraints

4. Files baseline
- create files with security-ready fields

5. Catalog baseline
- create developers, projects
- create project_phases, project_towers, project_layouts

6. Inventory baseline
- create units, pricing_snapshots

7. Project association/content baseline
- create project_media, project_nearby_places, project_amenities, project_tags
- defer project_bankers and panel_bankers

8. Index and constraint hardening
- apply all unique constraints and performance indexes

9. Seed execution order (after schema migration)
- core lookups -> geo -> minimal catalog -> optional demo -> dev-only bootstrap
- optional demo seed executes only when explicit flag is set

## 13. Risks and edge cases
High risks:
- Parent-scoped slug migration may fail if existing duplicate data conflicts under new scope assumptions.
- Existing seed upsert logic that uses slug-only target for regions/areas will not match new composite uniqueness.
- files table extension can break existing upload assumptions if application layer is not updated together.

Medium risks:
- pricing_snapshots dimensional queries can become slow without composite indexes.
- nullable unique fields in users may behave unexpectedly depending on DB null semantics and app expectations.
- projects with missing type/category references can degrade filtering quality.

Edge cases:
- same region slug across two states should be valid post-change.
- same area slug across two different regions should be valid post-change.
- project_towers unique(project_id, tower_number) must handle null tower_number carefully.
- project_phases unique(project_id, phase_code) must allow null phase_code safely.

## 14. Open questions before implementation
1. Do we want enum constraints for files.scan_status and files.visibility_scope in Phase 1A, or keep flexible varchar + app validation?
2. Should files.bucket be mandatory in all providers from day one, or nullable for providers that do not use bucket semantics?
3. Should project_nearby_places.category be lookup-driven in Phase 1A, or remain controlled free-text/varchar until Phase 2 normalization?
4. For future multi-country expansion, when should state-level uniqueness evolve into country-scoped uniqueness?

## 15. Final recommendation on whether Phase 1A is ready to implement
Recommendation: Ready with conditions.

Phase 1A is implementation-ready if the following are confirmed before coding:
- parent-scoped uniqueness migration strategy for regions and areas
- files security metadata final field list and enum values
- seed rewrite plan for geo upserts and dev-only admin bootstrap
- banker and lawyer table deferment from strict Phase 1A baseline

Go/No-Go status:
- Go for Phase 1A after confirming the four conditions above.
- No-Go only if geo uniqueness and seed strategy are left ambiguous, as those directly affect migration correctness.
