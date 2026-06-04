# Phase 2D.2 Project Schema Mapping + Implementation Notes

Date: 2026-06-04
Phase: 2D.2
Scope: Documentation and schema mapping only
Status: Draft for implementation handoff

References:
- docs/internal/phase-2d-admin-projects-foundation-spec.md
- docs/database/implementation-plan.md
- docs/database/reports/2026-05-29-post-phase-1-database-closure-integration-readiness-report.md
- src/db/schema/catalog.ts
- src/db/schema/inventory.ts
- src/db/schema/lookups.ts
- src/db/schema/geo.ts
- src/db/schema/files.ts
- src/db/schema/relations.ts
- src/db/schema/audit.ts
- src/db/schema/index.ts
- src/db/seeds/00-core-lookups.ts
- src/db/seeds/01-geo.ts
- src/db/seeds/02-catalog-minimum.ts
- src/db/seeds/03-demo-projects-optional.ts
- src/config/routes.ts
- src/config/internal-navigation.ts
- package.json

## 1) Objective
Map existing project-related schema for Admin Projects MVP and confirm what can be used safely for list/create/edit.

Goals:
- identify directly usable fields in current schema
- define list/create/edit contracts aligned to actual nullability/default behavior
- identify real schema gaps without proposing immediate schema changes
- keep this phase documentation-only with no runtime implementation

## 2) Schema tables reviewed
Reviewed tables and modules:
- projects
- developers
- project_phases
- project_towers
- project_layouts
- project_media
- project_amenities
- project_tags
- project_nearby_places
- units
- pricing_snapshots
- files
- states
- regions
- areas
- project_statuses
- property_categories
- property_types
- tenure_types
- title_types
- layout_types
- media_types
- audit_logs

Also reviewed for mapping context:
- src/db/schema/relations.ts
- src/db/schema/index.ts
- seed readiness in 00-core-lookups.ts, 01-geo.ts, 02-catalog-minimum.ts, 03-demo-projects-optional.ts

## 3) Projects table field mapping
Source of truth: src/db/schema/catalog.ts (`projects` table, with `slugColumns()` and `baseColumns()` composition).

| Business field | Existing schema field | Required for MVP? | List page? | Create form? | Edit form? | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Project name | projects.name | Yes | Yes | Yes | Yes | `name` comes from `slugColumns()`, not null. |
| Display name | projects.displayName | Recommended | Yes | Optional | Optional | Nullable; can differ from internal name for presentation. |
| Legal name | projects.legalName | Recommended | Optional | Optional | Optional | Nullable legal entity naming. |
| Slug | projects.slug | Yes | Yes | Optional input or auto-generate | Editable with caution | Not null + unique index; normalization and uniqueness check required. |
| Description | projects.description | Optional | Optional | Optional | Optional | Text field from `slugColumns()`, nullable. |
| Developer | projects.developerId | Yes | Yes | Yes | Yes | Not null FK to `developers`. |
| Property category | projects.propertyCategoryId | Optional | Yes | Optional | Optional | Nullable FK to `property_categories`. |
| Property type | projects.propertyTypeId | Optional | Yes | Optional | Optional | Nullable FK to `property_types`. |
| Project status | projects.projectStatusId | Recommended | Yes | Optional | Optional | Nullable FK to `project_statuses`; recommended to require at app level. |
| Tenure type | projects.tenureTypeId | Yes | Yes | Yes | Yes | Not null FK to `tenure_types`. |
| Title type | projects.titleTypeId | Optional | Optional | Optional | Optional | Nullable FK to `title_types`. |
| Region | projects.regionId | Optional | Yes | Optional | Optional | Nullable FK to `regions`. |
| Area | projects.areaId | Optional | Yes | Optional | Optional | Nullable FK to `areas`. |
| Address | projects.address | Optional | Optional | Optional | Optional | Nullable text. |
| Latitude | projects.latitude | Optional | Optional | Optional | Optional | Nullable decimal(10,8). |
| Longitude | projects.longitude | Optional | Optional | Optional | Optional | Nullable decimal(11,8). |
| Land area acres | projects.landAreaAcres | Optional | Optional | Optional | Optional | Nullable decimal(10,4). |
| Total units | projects.totalUnits | Yes | Yes | Optional | Optional | Not null with default 0. |
| Launch year | projects.launchYear | Optional | Yes | Optional | Optional | Nullable integer. |
| Featured file | projects.featuredFileId | Optional | Optional | Optional | Optional | Nullable FK to `files`; upload flow is out of scope now. |
| Is published | projects.isPublished | Yes | Yes | Optional | Yes | Not null default false. |
| Created at | projects.createdAt | Yes (system) | Yes | No | No | From `baseColumns()`, auto default. |
| Updated at | projects.updatedAt | Yes (system) | Yes | No | No | From `baseColumns()`, auto default + on update. |

## 4) Lookup mapping

### project_statuses
- Source table: `project_statuses`
- Display field: `name` (with optional `code` in admin filters)
- Stored FK on projects: `projects.projectStatusId`
- Create/edit requirement: schema nullable, app-level recommended required
- Seed readiness: seeded in `00-core-lookups.ts` (`NEW_LAUNCH`, `UNDER_CONSTRUCTION`, `COMPLETED`)

### property_categories
- Source table: `property_categories`
- Display field: `name`
- Stored FK on projects: `projects.propertyCategoryId`
- Create/edit requirement: optional (nullable FK)
- Seed readiness: seeded in `00-core-lookups.ts`

### property_types
- Source table: `property_types`
- Display field: `name` (and optionally `slug`)
- Stored FK on projects: `projects.propertyTypeId`
- Create/edit requirement: optional (nullable FK)
- Seed readiness: seeded in `00-core-lookups.ts`, tied to categories via `categoryId`

### tenure_types
- Source table: `tenure_types`
- Display field: `name`
- Stored FK on projects: `projects.tenureTypeId`
- Create/edit requirement: required (not null FK)
- Seed readiness: seeded in `00-core-lookups.ts` (`FREEHOLD`, `LEASEHOLD_99`)

### title_types
- Source table: `title_types`
- Display field: `name`
- Stored FK on projects: `projects.titleTypeId`
- Create/edit requirement: optional (nullable FK)
- Seed readiness: seeded in `00-core-lookups.ts`

### regions
- Source table: `regions`
- Display field: `name`
- Stored FK on projects: `projects.regionId`
- Create/edit requirement: optional (nullable FK)
- Seed readiness: seeded in `01-geo.ts`

### areas
- Source table: `areas`
- Display field: `name`
- Stored FK on projects: `projects.areaId`
- Create/edit requirement: optional (nullable FK)
- Seed readiness: seeded in `01-geo.ts`

### developers
- Source table: `developers`
- Display field: `name` (optionally `legalName`)
- Stored FK on projects: `projects.developerId`
- Create/edit requirement: required (not null FK)
- Seed readiness: seeded in `02-catalog-minimum.ts` (`demo-developer`), used by `03-demo-projects-optional.ts`

## 5) List page field contract
Proposed safe fields for `listAdminProjects`:
- `projects.id`
- `projects.name` and `projects.displayName`
- `projects.slug`
- developer name from `developers.name`
- region and area names from `regions.name`, `areas.name`
- project status from joined `project_statuses.name`
- property category and property type from joins
- `projects.isPublished`
- `projects.totalUnits`
- `projects.launchYear`
- `projects.createdAt`
- `projects.updatedAt`

Optional derived fields (defer from first list query if expensive):
- min and max price from `units` (`basePrice`/`finalPrice`) and/or `pricing_snapshots`
- layout/size range from `project_layouts.builtUpSqft` and/or `units.builtUpSqft`/`units.landAreaSqft`
- bedroom and bathroom summary from `project_layouts`

## 6) Create form field contract
MVP create field contract aligned to schema nullability/defaults:
- `name`: required (not null)
- `slug`: optional input if auto-generated; final persisted value required and unique
- `displayName`: optional
- `legalName`: optional
- `description`: optional
- `developerId`: required (not null FK)
- `propertyCategoryId`: optional (nullable FK)
- `propertyTypeId`: optional (nullable FK)
- `projectStatusId`: optional by schema; recommended required by app rule
- `tenureTypeId`: required (not null FK)
- `titleTypeId`: optional (nullable FK)
- `regionId`: optional (nullable FK)
- `areaId`: optional (nullable FK)
- `address`: optional
- `latitude`/`longitude`: optional
- `landAreaAcres`: optional
- `totalUnits`: optional input (defaults to 0 if omitted)
- `launchYear`: optional
- `isPublished`: defaults false if omitted

Additional schema defaults that can remain implicit in MVP create:
- `isHotDeal` defaults false
- `isForeignerEligible` defaults true
- `isGatedCommunity` defaults false
- `bookingFee` defaults 1000.00

## 7) Edit form field contract
Editable fields for MVP:
- `name`
- `slug` (editable with normalization + uniqueness checks)
- `displayName`
- `legalName`
- `description`
- `developerId`
- `propertyCategoryId`
- `propertyTypeId`
- `projectStatusId`
- `tenureTypeId`
- `titleTypeId`
- `regionId`
- `areaId`
- `address`
- `latitude`/`longitude`
- `landAreaAcres`
- `totalUnits`
- `launchYear`
- `isPublished`
- optional controlled fields if included later in UI: `isHotDeal`, `featuredFileId`

Fields that should not be casually editable in MVP:
- `id`
- `createdAt`
- `updatedAt`
- soft-delete fields (if used later)

Slug requirement:
- slug must be normalized and uniqueness-checked before write because `projects.slug` is unique and not null.

## 8) Derived fields strategy

### min/max price
- Status: derived now
- Source: `units.basePrice`/`units.finalPrice` and optionally `pricing_snapshots` latest snapshot
- Recommendation: derive in list/detail query layers, no schema change in MVP

### min/max size
- Status: derived now
- Source: `project_layouts.builtUpSqft`, optional fallback from `units.builtUpSqft`/`units.landAreaSqft`
- Recommendation: derive later in read model; keep project base record minimal

### bedroom summary
- Status: derived now
- Source: `project_layouts.bedrooms`
- Recommendation: derive aggregate or range for display only

### bathroom summary
- Status: derived now
- Source: `project_layouts.bathrooms`
- Recommendation: derive aggregate or range for display only

### featured image/media
- Status: directly available and partially deferred
- Source: direct `projects.featuredFileId` and related `project_media`
- Recommendation: allow selecting existing file id later; full media upload workflow remains deferred

Overall strategy:
- keep direct project create/edit minimal
- derive rich display fields progressively from related catalog/inventory/media tables
- avoid migration unless proven necessary in implementation

## 9) Audit mapping
Source: `audit_logs` table in `src/db/schema/audit.ts`

Audit compatibility check:
- `actionType` is `varchar(40)` and not enum-constrained
- proposed values fit within length 40:
  - `PROJECT_CREATED`
  - `PROJECT_UPDATED`
  - `PROJECT_PUBLISHED`
  - `PROJECT_UNPUBLISHED`
  - `PROJECT_ARCHIVED`

Conclusion:
- action types above are compatible without schema changes
- no fallback is required for length/constraint reasons
- optional fallback strategy (if a naming policy changes later): keep canonical short `actionType` and store detailed semantic subtype in `metadata.eventType`

## 10) Validation mapping
Validation rules aligned to schema:
- required fields for create/update paths:
  - `name`
  - `slug` final persisted value
  - `developerId`
  - `tenureTypeId`
- FK validation:
  - validate existence of referenced rows for all provided FK fields
- slug uniqueness:
  - enforce normalized unique slug check before insert/update
- numeric checks:
  - `landAreaAcres >= 0`
  - `totalUnits >= 0`
  - if latitude/longitude provided, validate numeric ranges
- launch year:
  - integer check and sensible range validation (app-level policy)
- isPublished default:
  - default false on create unless explicitly set
- safe errors:
  - return generic, non-sensitive messages
  - avoid exposing SQL internals or stack traces

## 11) Schema gaps / addendum candidates
Only real gaps and whether they block MVP:

### explicit minPrice/maxPrice on projects
- Needed now: no
- Can defer: yes
- Suggested future addendum: optional, if repeated aggregation causes performance or complexity issues

### explicit minSize/maxSize on projects
- Needed now: no
- Can defer: yes
- Suggested future addendum: optional for denormalized read optimization

### explicit bedroom/bathroom summary on projects
- Needed now: no
- Can defer: yes
- Suggested future addendum: optional if aggregate computation becomes expensive

### internal remarks field on projects
- Needed now: no
- Can defer: yes
- Suggested future addendum: add internal_notes/internal_remarks if product requires operational commentary

### publish workflow status beyond boolean
- Needed now: no
- Can defer: yes
- Suggested future addendum: optional approval-state workflow if moderated publishing is required

### project code field
- Needed now: no
- Can defer: yes
- Suggested future addendum: optional `projectCode` if business requires separate stable code distinct from slug

### media upload workflow
- Needed now: no
- Can defer: yes
- Suggested future addendum: media upload orchestration and file linking in later phase

## 12) Recommended MVP implementation path
Recommended next phases:
- 2D.3 `listAdminProjects` + `/admin/projects` list page
- 2D.4 create/update server actions with validation
- 2D.5 project form UI
- 2D.6 audit logging
- 2D.7 verification report

Execution guidance:
- keep first iteration focused on direct `projects` fields + lookup joins
- defer heavy derived aggregates until baseline list/create/edit is stable
- preserve current role guard model (ADMIN/SUPER_ADMIN) in implementation phase

## 13) Final recommendation
Current schema is sufficient for 2D.3 project list implementation.

DB migration requirement before 2D.3:
- Not required.

Migration/addendum should only be considered later if field/aggregation constraints prove insufficient during implementation or performance tuning.
