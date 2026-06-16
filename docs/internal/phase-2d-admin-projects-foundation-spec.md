# Phase 2D Admin Projects Foundation Specification

Date: 2026-06-04
Phase: 2D.1
Scope: Planning and specification only
Status: Draft for approval

References:
- docs/auth/phase-2a-auth-access-integration-closure-report.md
- docs/auth/phase-2b-internal-user-management-closure-report.md
- docs/internal/phase-2c-internal-shell-navigation-verification-report.md
- docs/internal/phase-2c-admin-agent-shell-navigation-spec.md
- docs/database/implementation-plan.md
- docs/database/reports/2026-05-29-post-phase-1-database-closure-integration-readiness-report.md
- src/db/schema/catalog.ts
- src/db/schema/inventory.ts
- src/db/schema/lookups.ts
- src/db/schema/geo.ts
- src/db/schema/files.ts
- src/db/schema/relations.ts
- src/db/schema/audit.ts
- src/db/seeds/index.ts
- src/db/seeds/00-core-lookups.ts
- src/db/seeds/01-geo.ts
- src/db/seeds/02-catalog-minimum.ts
- src/db/seeds/03-demo-projects-optional.ts
- src/config/routes.ts
- src/config/internal-navigation.ts
- src/app/(internal)/admin/layout.tsx
- src/app/(internal)/admin/page.tsx
- src/app/(internal)/admin/users/page.tsx
- src/components/internal/shell/index.ts
- package.json

## 1) Objective
Define Admin Projects Foundation for internal administration.

Primary intent:
- allow admin users to list, view, create, and update property projects safely
- prepare project records for future public showcase website and future agent/customer workflows
- keep implementation deferred until specification approval

No runtime implementation is included in this phase.

## 2) Current status
Current baseline confirms:
- Admin shell and internal navigation are implemented and stable.
- Admin user management at /admin/users is implemented.
- /admin/projects currently exists as placeholder navigation target only.
- Database project/catalog foundations already exist and must be mapped before coding.
- Project management UI for list/create/edit is not implemented yet.
- Public project showcase pages are not implemented yet.
- File/media upload workflow for projects is not implemented in this phase.

## 3) Business purpose
Project is the core property inventory entity and should support business-critical fields and relationships for internal operations now, with public/agent workflows later.

Business coverage target:
- project name and identity
- developer or owner organization
- location and geo context
- property category or type
- launch and project status
- price range context
- size range context
- bedroom and bathroom summary context
- tenure and title context
- publish status
- public visibility in later phase
- agent and internal visibility in later phase

## 4) Existing schema review requirement
Implementation phase must inspect and map the following before coding server actions or UI:
- project-related tables
- property or unit or inventory tables
- location and geo tables
- media and file tables
- lookup and status tables
- table relations
- seeds and lookup readiness

Required review set:
- project and catalog: projects, developers, project_phases, project_towers, project_layouts, project_media, project_amenities, project_tags, project_nearby_places
- inventory linkage: units, pricing_snapshots
- geo linkage: states, regions, areas
- media and files: files
- lookup and status: project_statuses, property_categories, property_types, tenure_types, title_types, layout_types, media_types
- relations mapping: src/db/schema/relations.ts
- seed readiness: src/db/seeds/00-core-lookups.ts, 01-geo.ts, 02-catalog-minimum.ts, 03-demo-projects-optional.ts

Schema sufficiency assessment for MVP:
- Appears sufficient for initial list/create/edit of basic project records using existing projects table and related lookups.
- Existing projects table includes: name, slug, description, displayName, legalName, developerId, propertyCategoryId, propertyTypeId, projectStatusId, tenureTypeId, titleTypeId, regionId, areaId, address, geo coordinates, landAreaAcres, totalUnits, launchYear, featuredFileId, isPublished, and metadata fields via base columns.
- Existing schema also supports richer future detail through project layouts, units, pricing snapshots, media, amenities, tags, and nearby places.

Potential addendum candidates (do not migrate in planning):
- explicit project-level minPrice and maxPrice fields if aggregation from units or pricing snapshots is insufficient
- explicit project-level minSize and maxSize fields if aggregation from layouts or units is insufficient
- explicit project-level bedroom and bathroom summary fields if derived summaries become expensive
- explicit publish workflow states beyond boolean publish flags if approval workflow is required

Planning rule:
- Do not force migration in this planning phase.
- Prefer existing schema first.
- If gaps remain during 2D.2 mapping, document in a short schema addendum proposal.

## 5) MVP scope
Admin Projects MVP scope:
- /admin/projects list page
- project search and filtering
- display safe project fields for internal operations
- create project basic record where current schema supports required fields
- edit project basic information where current schema supports required fields
- view project status and publish state where schema supports it
- no public showcase publishing automation in MVP

## 6) MVP fields
Proposed MVP fields, subject to final schema mapping confirmation:
- project name
- slug or internal code if used
- location: region and area
- project status
- property type or category
- tenure and title type where available
- min and max price (derived or explicit, based on schema mapping)
- min and max built-up or land size (derived or explicit, based on schema mapping)
- bedrooms and bathrooms summary (derived from layouts or stored summary if later needed)
- description and short description handling
- internal remarks if supported field exists, else defer to addendum
- isFeatured or isPublished where available
- createdAt and updatedAt

Current schema notes:
- isPublished exists directly on projects.
- isFeatured does not exist on projects; isHotDeal exists on projects and isFeatured exists on developers.
- project name and slug are available from slug columns.
- price and size summaries may initially be derived from related tables if direct fields are absent.

## 7) Admin route plan
Proposed routes:
- /admin/projects
- /admin/projects/new
- /admin/projects/[id]
- /admin/projects/[id]/edit

MVP starting routes:
- /admin/projects list
- /admin/projects/new
- /admin/projects/[id]/edit

Optional detail route can follow after list and form flows stabilize.

## 8) Component proposal
Proposed reusable components:
- AdminProjectsTable
- ProjectStatusBadge
- ProjectPublishBadge
- ProjectSearchFilters
- ProjectForm
- ProjectFormFields
- ProjectLocationFields
- ProjectPriceFields
- ProjectSizeFields
- ProjectDetailSummary

Composition notes:
- follow /admin/users page structure for consistency
- keep form field groups modular for create and edit reuse
- keep table and badges reusable across list and detail surfaces

## 9) Server action and server function proposal
Proposed server-side functions and actions:
- listAdminProjects
- getAdminProjectById
- createAdminProject
- updateAdminProject
- archiveAdminProject later (optional)

Rules:
- server-side validation only
- actor must be ADMIN or SUPER_ADMIN
- no client-trusted authorization
- no public project mutation endpoint
- no dependency on permission resolver in MVP

## 10) Validation requirements
Recommended validation baseline:
- project name required
- slug or code normalized and uniqueness-checked when used
- status must reference valid lookup status
- numeric price fields must be non-negative
- numeric size fields must be non-negative
- publish defaults to draft or unpublished behavior where available
- safe, non-sensitive error messages only

Validation source of truth:
- perform validation on server action boundary before persistence
- mirror basic constraints in UI for usability only, never as authority

## 11) Audit requirements
Planned audit events:
- PROJECT_CREATED
- PROJECT_UPDATED
- PROJECT_PUBLISHED
- PROJECT_UNPUBLISHED
- PROJECT_ARCHIVED

Audit payload should include:
- actor user id
- project id
- action type
- beforeJson and afterJson where practical
- source app ADMIN_PORTAL
- request id and trace id where available

MVP audit guidance:
- audit is recommended for create and update if audit schema mapping supports selected action types
- if actionType mapping is unclear, produce a short implementation notes document before writing audit code

## 12) Security rules
Security rules for implementation phase:
- only ADMIN and SUPER_ADMIN can access /admin/projects
- keep server-side route guards in layout or page-level entrypoints
- no public mutation endpoint
- no client-trusted authorization
- no permission resolver in this phase
- no middleware in this phase
- no DB schema changes in planning
- no file upload implementation yet unless separately approved
- no public publishing workflow yet unless separately approved

## 13) UI and UX requirements
UI and UX requirements for MVP implementation:
- use existing InternalShell
- Admin Projects navigation item should become active once route exists
- clean SaaS table and list layout
- visual consistency with /admin/users page patterns
- keep other non-implemented modules marked as coming soon
- no fake metrics
- no heavy animation

## 14) Implementation phases
- 2D.1 Admin Projects Foundation spec approval
- 2D.2 Project schema mapping and implementation notes
- 2D.3 listAdminProjects server function plus /admin/projects list page
- 2D.4 Project create and edit server actions with validation
- 2D.5 Project form UI
- 2D.6 Project audit logging if supported
- 2D.7 Verification report
- optional later: project media and files workflow
- optional later: public showcase publishing workflow

## 15) Test checklist
- ADMIN can access /admin/projects
- AGENT cannot access /admin/projects
- CUSTOMER cannot access /admin/projects
- unauthenticated user redirects to login
- project list displays
- search and filter works
- create project validates required fields
- edit project updates allowed fields
- invalid data is rejected safely
- audit log written for create and update if implemented
- /admin/users still works after projects module changes
- public auth remains CUSTOMER-only

## 16) Known exclusions
- No implementation yet
- No DB migration
- No project media upload
- No public showcase pages
- No unit or inventory management
- No leads or bookings integration
- No permission resolver
- No middleware
- No production publishing workflow

## 17) Final recommendation
Phase 2D.2 Project Schema Mapping can proceed after this specification is approved.

Recommended immediate next step after approval:
- execute 2D.2 as a schema-mapping and field-contract checkpoint against existing catalog and related tables
- only raise a schema addendum proposal if required MVP fields cannot be represented safely with current schema
