# Phase 2L Public Funnel Completion Specification

Date: 2026-06-13
Phase task: O16-T01
Status: Completed
Scope: Public/customer-facing funnel completion for discovery and inquiry capture

## 1. O16 delivery target

Implement a function-complete public funnel that allows external users to:
- discover published projects,
- inspect project details,
- submit contact inquiries,
- submit book-viewing requests,
- and persist all inbound demand into internal leads/inquiries/activity/audit workflows.

Out of scope for O16:
- customer self-serve account portal,
- public file upload,
- payment/booking contract lifecycle from public route,
- deep UI/UX redesign (reserved for O17).

## 2. Public route completion matrix

| Route | Current state before O16 | O16 completion target |
| --- | --- | --- |
| / | Placeholder shell | Hero + featured published projects + direct funnel CTAs + embedded contact capture |
| /projects | Placeholder | Search/filter/paginated published project listing |
| /projects/[slug] | Placeholder | Published-project detail with layouts/media/nearby info + project-bound inquiry capture |
| /contact | Placeholder | Operational contact form writing to leads/inquiries |
| /book-viewing | Placeholder | Operational viewing request form writing to leads/inquiries/activity |
| /about | Placeholder | Non-placeholder company/about baseline with public funnel CTAs |

## 3. Backend primitive contract (O16-T02)

### 3.1 Public project discovery

New module: src/lib/public/projects/actions.ts

Required primitives:
- listPublicProjects(params)
  - published + active + non-deleted projects only
  - query search/filter/pagination support
  - include filter option payloads for category/status/region
- getPublicProjectBySlug(slug)
  - published + active + non-deleted gate
  - return null when slug is invalid/unpublished
  - include layouts/media/nearby places and similar projects
- listPublicProjectOptions()
  - lightweight project options for contact/book-viewing form selects
- listFeaturedPublicProjects(limit)
  - small featured set for home page blocks

### 3.2 Inquiry and book-viewing capture

New module: src/lib/public/inquiries/actions.ts

Required primitive:
- submitPublicInquiry(input)
  - input validation and normalization (name, phone, email, message, project)
  - normalize phone to E.164 using existing OTP phone utility
  - resolve active WEB_FORM lead source
  - upsert lead by normalized phone
  - insert inquiry row
  - insert lead activity row
  - insert audit row
  - return typed success/failure contract with field-level errors

New module: src/lib/public/inquiries/server-actions.ts

Required wrappers:
- submitPublicContactFormAction(prevState, formData)
- submitPublicBookViewingFormAction(prevState, formData)

Both wrappers must remain Next 16 compliant:
- file-level use server with async-function exports only
- no exported runtime constants from the server-actions module

## 4. Frontend composition contract (O16-T03)

New shared components under src/components/public:
- project-card.tsx
- public-inquiry-form.tsx
- public-book-viewing-form.tsx

Composition requirements:
- use server component data loaders in route pages
- use client components only where form action state is needed
- preserve existing PublicShell ownership in src/components/layout/public-shell.tsx
- surface empty states when no published projects exist

## 5. Acceptance criteria

O16 is accepted only when all criteria below are met:

1. Public routes listed in section 2 are no longer placeholder pages.
2. Project listing and detail pages only show published + active + non-deleted data.
3. Contact and book-viewing forms persist demand into:
   - leads,
   - inquiries,
   - lead_activities,
   - audit_logs.
4. Validation errors are returned as field-level feedback on form UI.
5. Lint, typecheck, and test gates pass.
6. Runtime verification report exists with route-level and persistence evidence.

## 6. Customer account MVP decision (DQ-005)

Decision: Defer customer account MVP from O16 and close decision queue item DQ-005.

Rationale:
- O16 objective is external funnel completion and demand capture, not customer self-service lifecycle.
- Existing internal workflows (lead assignment, status progression, booking/document operations) already consume inquiry data without customer login dependency.
- Adding customer account now would expand scope into profile, booking/document self-service authorization, and support/identity lifecycle that exceeds O16 risk budget.

Follow-up:
- Reopen as a dedicated post-O17 scope proposal if product priorities require authenticated customer workspace.

## 7. Implementation sequence lock

1. O16-T01 (this spec) complete.
2. O16-T02 backend primitives complete.
3. O16-T03 frontend route replacement complete.
4. O16-T04 verification and tracker closure complete.
