# Phase 2D.4 Project Actions + Validation Notes

Date: 2026-06-05
Phase: 2D.4
Scope: Server-side helper and validation layer only
Status: Implementation notes

## Summary
This phase introduces server-side helpers for project create/update preparation and mutation handling:
- getAdminProjectFormOptions
- getAdminProjectById
- createAdminProject
- updateAdminProject

Validation and slug normalization are centralized in helper modules to support future create/edit UI slices.

## Validation coverage
Implemented validation includes:
- required name for create
- slug normalization and generation fallback from name
- slug uniqueness checks for create/update
- required lookup ids for create: developerId, projectStatusId, tenureTypeId
- optional lookup existence checks when provided
- nullable text normalization (trim + empty to null)
- numeric and range guards:
  - totalUnits integer >= 0
  - launchYear 1900..currentYear+10
  - landAreaAcres >= 0
  - latitude -90..90
  - longitude -180..180
- isPublished default false on create

## Security posture
- Server-side only helpers
- ADMIN/SUPER_ADMIN guard enforced in helper entrypoints
- no public mutation endpoint
- safe result unions, no raw SQL error leakage

## Audit
Audit writes are intentionally deferred in this phase.

Planned:
- Phase 2D.6 will add project create/update publish/unpublish audit logging.
- Current 2D.4 code should not claim create/update auditing yet.
