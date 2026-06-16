# Implementation Roadmap

Last updated: 2026-06-13
Planning horizon: Current to medium-term

## Phase O1 - Orchestrator baseline (documentation-only)
Status:
- Completed on 2026-06-12.

Objective:
Establish orchestration control files grounded in actual repository state.

Scope:
- Create docs/ai-orchestrator baseline files.
- Record state, map, roles, roadmap, backlog, rules, and checklists.

Affected files:
- docs/ai-orchestrator/*

Database changes:
- None.

Backend changes:
- None.

Frontend changes:
- None.

Validation checks:
- git status --short
- npm run lint
- npx tsc --noEmit

Definition of done:
- Orchestrator docs exist and reflect repository evidence.
- Initial prioritized backlog is defined.
- Verification checklist is actionable.

## Phase O2 - Evidence alignment and governance hardening
Status:
- Completed baseline on 2026-06-12.

Objective:
Remove documentation drift and align process files with real implementation state.

Scope:
- Reconcile outdated phase statements where code has moved ahead.
- Fill currently empty governance docs in docs/ai-sdlc.
- Standardize phase-report template and acceptance criteria format.

Affected files:
- docs/ai-sdlc/*
- docs/auth/* (only where drift is confirmed)
- docs/internal/* (only where drift is confirmed)
- docs/ai-orchestrator/*

Database changes:
- None.

Backend changes:
- Optional minimal non-functional refactor only if needed for consistency.

Frontend changes:
- None required.

Validation checks:
- git status --short
- npm run lint
- npx tsc --noEmit

Definition of done:
- No major contradiction remains between docs and runtime code.
- SDLC governance docs are no longer empty placeholders.

## Phase O3 - Admin surface stabilization
Status:
- Started on 2026-06-12.
- Auth and role-guard critical path test baseline completed on 2026-06-12.
- Manual verification and targeted bug-fix loop completed on 2026-06-13.

Objective:
Finish manual verification and close known quality gaps for implemented admin modules.

Scope:
- Execute and document pending manual checks for admin users/projects.
- Fix defects discovered during verification.
- Tighten edge-case validation and error handling if needed.

Affected files:
- src/app/(internal)/admin/users/*
- src/app/(internal)/admin/projects/*
- src/lib/admin/users/*
- src/lib/admin/projects/*
- docs/internal/*

Database changes:
- None expected.

Backend changes:
- Bug-fix level changes only.

Frontend changes:
- Bug-fix and UX-completion level changes only.

Validation checks:
- git status --short
- npm run lint
- npx tsc --noEmit
- targeted manual checks for role and project flows

Definition of done:
- Pending verification checklist items are resolved or explicitly deferred with rationale.

## Phase O4 - Leads vertical slice (first non-placeholder business module)
Status:
- Completed baseline on 2026-06-12.

Objective:
Implement minimum viable leads management end-to-end using existing DB foundation.

Scope:
- Lead list/read/update status and assignment primitives.
- Admin or agent route integration for first operational workflow.

Affected files:
- src/app/(internal)/agent/leads/page.tsx (and/or admin leads route)
- src/lib/leads/* (new)
- src/components/leads/* (new)
- docs/features/* or docs/internal/*

Database changes:
- Only if required after schema validation; migration impact must be documented.

Backend changes:
- Server helpers/actions and role checks.

Frontend changes:
- Leads table/forms, empty/loading/error states.

Validation checks:
- git status --short
- npm run lint
- npx tsc --noEmit
- module manual scenarios

Definition of done:
- One complete leads workflow is operational and verified.

## Phase O5 - Booking/documents core workflow
Status:
- Completed read/write baseline on 2026-06-12.
- Manual runtime verification and targeted bug-fix follow-up remain.

Objective:
Deliver first booking and document submission/verification workflow.

Scope:
- Minimal booking transition path.
- Document request and submission flow for booking context.

Affected files:
- src/app/(internal)/admin/bookings/*
- src/app/(internal)/agent/bookings/*
- src/app/(internal)/admin/documents/*
- src/lib/booking/* (new)
- src/lib/documents/* (new)

Database changes:
- Prefer no schema change initially; if needed, add migration with compatibility notes.

Backend changes:
- Transaction-safe status transitions with audit logging.

Frontend changes:
- Booking and document operation screens replacing placeholders.

Validation checks:
- git status --short
- npm run lint
- npx tsc --noEmit
- workflow manual checks

Definition of done:
- Booking plus document flow works end-to-end for defined MVP path.

## Phase O6 - DevOps and test automation baseline
Status:
- Completed baseline on 2026-06-12.

Objective:
Establish minimum CI and test scaffolding for regression control.

Scope:
- Add baseline CI workflow for lint and typecheck.
- Add initial test strategy and first automated tests for critical auth/admin flows.

Affected files:
- .github/workflows/* (new)
- test config and test files (new)
- docs/ai-orchestrator/verification-checklist.md

Database changes:
- None.

Backend changes:
- Testability hooks only where necessary.

Frontend changes:
- Testability improvements only where needed.

Validation checks:
- CI pipeline run
- local lint/typecheck/tests

Definition of done:
- CI reliably validates core quality gates on every PR.

## Phase O7 - WhatsApp routing visibility baseline
Status:
- Completed read visibility baseline on 2026-06-12.
- Completed inbound webhook processing and assignment baseline on 2026-06-12.

Objective:
Introduce internal operational visibility for queue and conversation state.

Scope:
- Add queue and open conversation snapshot to internal workspace.
- Add inbound webhook ingestion endpoint with idempotent persistence and rule-based assignment baseline.

Affected files:
- src/lib/internal/whatsapp/*
- src/app/(internal)/admin/leads/page.tsx
- src/app/(internal)/agent/leads/page.tsx
- src/app/api/whatsapp/webhook/route.ts

Database changes:
- None.

Backend changes:
- Read query helpers with role-scoped filtering, plus inbound webhook ingestion and assignment logic.

Frontend changes:
- Workspace cards and tables for queue and conversation snapshot.

Validation checks:
- git status --short
- npm run lint
- npx tsc --noEmit
- npm run test

Definition of done:
- Internal users can view queue and open-conversation snapshot in role-scoped pages.
- Inbound webhook events can be persisted and routed to lead/conversation/assignment baselines.

## Phase O8 - Runtime verification follow-up for stateful slices
Status:
- Started on 2026-06-13.
- Completed on 2026-06-13 for scoped baseline verification.
- Admin and agent manual booking/document transition checks completed with persisted status/audit evidence.
- Live webhook runtime smoke checks completed (success, duplicate, invalid payload).
- Invalid-signature webhook check is not currently applicable in local env because WHATSAPP_WEBHOOK_SECRET is unset.

Objective:
Close quality gap between baseline implementation and proven runtime behavior in local seeded environment.

Scope:
- Execute manual runtime scenarios for booking status transitions (admin and agent).
- Execute manual runtime scenarios for document request status transitions (admin and agent).
- Execute webhook ingestion scenarios for success, duplicate event, and invalid payload/signature behavior.
- Patch defects discovered during verification.

Affected files:
- src/app/(internal)/admin/bookings/*
- src/app/(internal)/agent/bookings/*
- src/app/(internal)/admin/documents/*
- src/app/(internal)/agent/documents/*
- src/app/api/whatsapp/webhook/route.ts
- src/lib/internal/bookings/*
- src/lib/internal/documents/*
- src/lib/internal/whatsapp/*
- docs/internal/*

Database changes:
- None expected.

Backend changes:
- Bug-fix only if runtime defects are confirmed.

Frontend changes:
- Bug-fix only if runtime defects are confirmed.

Validation checks:
- git status --short
- npm run lint
- npx tsc --noEmit
- npm run test
- seeded manual runtime scenarios

Definition of done:
- Stateful booking/document and webhook baseline behaviors are manually verified with evidence.
- Any discovered defects are fixed or explicitly deferred with rationale and risk notes.

## Phase O9 - Admin project media and file linking
Status:
- Completed on 2026-06-13.
- Featured file lookup wiring and create/edit form selector baseline completed.
- Featured-file runtime verification completed on 2026-06-13 (O9-T04).
- Server-action form parser defect discovered during verification and fixed (featuredFileId was previously omitted from FormData mapping).
- O9-T05 backend project_media attach/list/remove primitives completed on 2026-06-13 with role guard, validation, and audit hook coverage.
- O9-T06 admin edit-page project media manager UI completed on 2026-06-13 with attach/remove forms and linked-media listing.
- O9-T07 closure verification completed on 2026-06-13 with runtime evidence report and in-scope validation bug fix for blank sort-order parsing.

Objective:
Extend admin project foundation with safe file-linking and first project media relation management primitives.

Scope:
- Expose featuredFileId selection from existing files records in project create/edit form.
- Validate and verify featured file linking behavior end-to-end.
- Implement project_media attach/list/remove baseline in admin project flow.
- Preserve explicit exclusion of upload pipeline and public showcase publishing.

Affected files:
- src/lib/admin/projects/actions.ts
- src/components/admin/projects/project-form.tsx
- src/app/(internal)/admin/projects/*
- src/lib/admin/projects/*
- docs/internal/*

Database changes:
- Prefer no schema change; use existing files and project_media relations.

Backend changes:
- Form-option lookup wiring, relation mutation helpers, audit hooks.

Frontend changes:
- Featured file selector, project media list controls, empty/error/loading states.

Validation checks:
- git status --short
- npm run lint
- npx tsc --noEmit
- module manual scenarios

Definition of done:
- Admin users can link featured file and manage project media relations with validation and audit-safe behavior.

## Phase O10 - Admin users permission hardening
Status:
- Planned on 2026-06-13 as next active phase after O9 closure.
- Started on 2026-06-13.
- O10-T01 acceptance criteria and permission boundary matrix completed on 2026-06-13.
- O10-T02 backend permission resolver hardening completed on 2026-06-13.
- O10-T03 frontend permission alignment completed on 2026-06-13.
- O10-T04 runtime verification completed on 2026-06-13 (report: docs/internal/phase-2f-admin-users-permission-runtime-verification-report.md).
- O10-T05 targeted automated policy test coverage completed on 2026-06-13.
- O10 scoped tasks are complete.

Objective:
Close deferred permission-level resolver gap in admin users module and tighten role-assignment safety boundaries.

Scope:
- Define explicit acceptance criteria for admin permission-resolver behavior.
- Implement backend permission-level resolver enforcement for role-change actions.
- Reflect permission constraints in admin users UI affordances and safe error messaging.
- Execute runtime verification and add focused automated coverage for permission policy paths.

Affected files:
- src/lib/admin/users/actions.ts
- src/lib/admin/users/role-policy.ts
- src/lib/admin/users/server-actions.ts
- src/components/admin/users/*
- src/app/(internal)/admin/users/page.tsx
- docs/internal/*
- docs/ai-orchestrator/*

Database changes:
- None expected.

Backend changes:
- Permission resolver + policy enforcement in role-assignment execution path.

Frontend changes:
- Permission-aware action availability and feedback in admin users UI.

Validation checks:
- git status --short
- npm run lint
- npx tsc --noEmit
- npm run test
- manual admin permission/role-change scenarios

Definition of done:
- Admin users module has explicit permission-level enforcement with runtime and automated verification evidence.

## Phase O11 - Internal shell consolidation
Status:
- Planned on 2026-06-13 as next active phase after O10 closure.
- Started on 2026-06-13.
- O11-T01 canonical shell ownership decision completed on 2026-06-13.
- O11-T02 legacy duplicate internal shell consolidation completed on 2026-06-13.
- O11-T03 regression verification completed on 2026-06-13.
- O11 scoped tasks are complete.

Objective:
Eliminate duplicate internal shell implementations to reduce navigation/layout drift risk and keep a single source of truth for internal portal chrome.

Scope:
- Define and document canonical internal shell ownership.
- Remove orphaned legacy internal shell files under src/components/layout.
- Verify admin internal routes still render correctly with canonical shell stack.

Affected files:
- src/components/layout/internal-shell.tsx (deleted)
- src/components/layout/internal-sidebar.tsx (deleted)
- src/components/layout/internal-topbar.tsx (deleted)
- src/components/layout/internal-workspace.ts (deleted)
- docs/ai-orchestrator/*
- docs/internal/*

Database changes:
- None.

Backend changes:
- None.

Frontend changes:
- Codebase consolidation only; no behavioral expansion.

Validation checks:
- git status --short
- npm run lint
- npx tsc --noEmit
- runtime smoke: /admin and /admin/users render

Definition of done:
- Only one internal shell implementation remains active in src/components/internal/shell.
- Legacy duplicate shell files are removed.
- Internal admin routes render with expected sidebar/topbar chrome post-consolidation.

## Phase O12 - Targeted deterministic test expansion
Status:
- Planned on 2026-06-13 as next active phase after O11 closure.
- Started on 2026-06-13.
- O12-T01 targeted coverage scope definition completed on 2026-06-13.
- O12-T02 admin project mutation validation tests completed on 2026-06-13.
- O12-T03 WhatsApp routing edge-case test expansion completed on 2026-06-13.
- O12 scoped tasks are complete.

Objective:
Expand automated regression protection with deterministic helper-level tests in high-impact admin and internal modules.

Scope:
- Add focused tests for admin project mutation validation normalization/error paths.
- Expand WhatsApp routing helper tests for unknown-strategy and unmatched-rule edge behavior.
- Keep scope to pure logic helpers without schema/runtime feature changes.

Affected files:
- src/lib/admin/projects/validation.test.ts (new)
- src/lib/internal/whatsapp/routing.test.ts
- docs/internal/*
- docs/ai-orchestrator/*

Database changes:
- None.

Backend changes:
- None.

Frontend changes:
- None.

Validation checks:
- git status --short
- npm run test -- src/lib/admin/projects/validation.test.ts src/lib/internal/whatsapp/routing.test.ts
- npm run lint
- npx tsc --noEmit

Definition of done:
- New deterministic tests are added and passing for scoped admin/internal helper logic.
- Lint and typecheck remain green.

## Phase O13 - Admin action testability seam extraction
Status:
- Planned on 2026-06-13 as next active phase after O12 slice.
- Started on 2026-06-13.
- O13-T01 testability seam definition completed on 2026-06-13.
- O13-T02 admin project FormData parser extraction completed on 2026-06-13.
- O13-T03 parser unit tests and quality verification completed on 2026-06-13.
- O13 scoped tasks are complete.

Objective:
Increase testability for DB-coupled admin server actions by isolating request parsing logic into deterministic pure helpers.

Scope:
- Extract project/media FormData parsing from use-server action module into pure parser module.
- Wire server actions to parser helper functions with no behavior expansion.
- Add parser unit tests and run lint/typecheck/test verification.

Affected files:
- src/lib/admin/projects/form-parser.ts (new)
- src/lib/admin/projects/form-parser.test.ts (new)
- src/lib/admin/projects/server-actions.ts
- docs/internal/*
- docs/ai-orchestrator/*

Database changes:
- None.

Backend changes:
- Testability refactor only; no mutation semantics changes.

Frontend changes:
- None.

Validation checks:
- git status --short
- npm run test -- src/lib/admin/projects/form-parser.test.ts src/lib/admin/projects/validation.test.ts
- npm run lint
- npx tsc --noEmit

Definition of done:
- Project/media request parsing is isolated into pure helpers with passing deterministic tests.
- Lint and typecheck remain green.

## Phase O14 - Admin workflow completion before redesign
Status:
- Planned on 2026-06-13 after feature-gap review.
- Started on 2026-06-13.
- O14-T01 admin completion specification finalized on 2026-06-13 (docs/internal/phase-2j-admin-completion-spec.md).
- O14-T02 admin properties and agents backend primitives completed on 2026-06-13 (src/lib/admin/properties/*, src/lib/admin/agents/*).
- O14-T03 admin properties, agents, and customers placeholder replacement completed on 2026-06-13 (src/app/(internal)/admin/{properties,agents,customers}/page.tsx with reusable tables).
- O14-T04 admin appointments, reports, and settings placeholder replacement completed on 2026-06-13 (src/app/(internal)/admin/{appointments,reports,settings}/page.tsx).
- O14-T05 workflow-safe lead status transitions completed on 2026-06-13 and integrated into admin/agent leads screens, aligning leads with existing booking/document transition actions.
- O14-T06 runtime verification completed on 2026-06-13 with closure report at docs/internal/phase-2j-admin-completion-verification-report.md.
- Phase O14 is closed.
- Highest delivery priority before any deep UI/UX revamp.

Objective:
Finish missing admin business workflows and replace remaining admin placeholders with operational feature modules built from reusable domain components.

Scope:
- Implement missing admin modules: properties, agents, customers, appointments, reports, settings.
- Upgrade admin leads, bookings, and documents from visibility/status baselines into real workflow screens.
- Preserve DRY rules by building reusable feature components and shared server primitives before page composition.

Affected files:
- src/app/(internal)/admin/*
- src/components/admin/*
- src/components/internal/*
- src/lib/admin/*
- src/lib/internal/*
- docs/internal/*
- docs/ai-orchestrator/*

Database changes:
- Only if gaps are confirmed after schema inspection; each migration must include compatibility notes.

Backend changes:
- Domain actions, server actions, validation, audit hooks, role-safe mutations.

Frontend changes:
- Reusable admin feature components composed into operational pages; no deep visual redesign yet.

Validation checks:
- git status --short
- npm run lint
- npx tsc --noEmit
- npm run test
- seeded admin workflow runtime scenarios

Definition of done:
- Admin placeholder routes are replaced or intentionally deferred with rationale.
- Admin operations cover core propertygo internal workflows with runtime verification evidence.

## Phase O15 - Agent workspace completion
Status:
- Planned on 2026-06-13.
- Started on 2026-06-13 after O14 closure.
- O15-T01 agent workspace completion specification finalized on 2026-06-13 (docs/internal/phase-2k-agent-workspace-completion-spec.md).
- O15-T02 baseline agent customers, appointments, and profile modules implemented on 2026-06-13 with lint/typecheck/tests passing.
- O15-T03 workflow upgrade completed on 2026-06-13: agent leads/bookings/documents now support richer role-safe transition actions with target selection and reason-note input.
- O15-T04 runtime verification completed on 2026-06-13 with seeded agent workflow checks and closure report at docs/internal/phase-2k-agent-workspace-completion-verification-report.md.
- Phase O15 closed on 2026-06-13.

Objective:
Complete agent operational workspace by reusing admin/internal primitives where possible and filling role-specific workflow gaps.

Scope:
- Implement missing agent modules: customers, appointments, profile.
- Upgrade agent leads, bookings, and documents from baseline tables into action-oriented workflow screens.
- Reuse shared domain components and backend policies from admin/internal slices wherever role-safe.

Affected files:
- src/app/(internal)/agent/*
- src/components/agent/*
- src/components/internal/*
- src/lib/internal/*
- docs/internal/*
- docs/ai-orchestrator/*

Database changes:
- Prefer none; add migrations only if proven necessary.

Backend changes:
- Role-scoped workflow actions and data adapters for agent use cases.

Frontend changes:
- Reusable workflow components and agent-specific page composition; no deep redesign yet.

Validation checks:
- git status --short
- npm run lint
- npx tsc --noEmit
- npm run test
- seeded agent workflow runtime scenarios

Definition of done:
- Agent workspace supports core day-to-day operations without placeholder blockers.
- Shared admin/internal abstractions remain DRY and role-safe.

## Phase O16 - Customer and public funnel completion
Status:
- Planned on 2026-06-13.
- Started on 2026-06-13 after O15 closure.
- O16-T01 acceptance specification completed on 2026-06-13 (docs/internal/phase-2l-public-funnel-completion-spec.md).
- O16-T02 backend primitives completed on 2026-06-13 (src/lib/public/projects/actions.ts, src/lib/public/inquiries/*).
- O16-T03 public route replacement completed on 2026-06-13 (all targeted src/app/(public) pages no longer placeholders).
- O16-T04 runtime verification completed on 2026-06-13 with closure report at docs/internal/phase-2l-public-funnel-verification-report.md.
- Phase O16 closed on 2026-06-13.

Objective:
Finish public/customer-facing product flows so external surfaces reflect real business capability before visual overhaul.

Scope:
- Implement real public pages for home, projects, project detail, contact, and book-viewing.
- Complete inquiry and booking funnel handoff into internal lead/booking workflows.
- Decide and implement customer account MVP or formally defer it with documented rationale.

Affected files:
- src/app/(public)/*
- src/components/layout/*
- src/components/public/*
- src/lib/public/*
- src/lib/internal/*
- docs/internal/*
- docs/ai-orchestrator/*

Database changes:
- As required by validated funnel gaps only.

Backend changes:
- Public query adapters, inquiry capture actions, booking/viewing primitives, customer-account decision follow-through.

Frontend changes:
- Replace public placeholders with feature-complete baseline pages and funnel steps.

Validation checks:
- git status --short
- npm run lint
- npx tsc --noEmit
- npm run test
- public-to-internal funnel runtime scenarios

Definition of done:
- External users can browse, inquire, and enter core booking/viewing flows against real backend behavior.
- Public surfaces are functionally complete enough to justify deep UX investment.

## Phase O17 - Deep UI/UX revamp after feature freeze
Status:
- Planned on 2026-06-13.
- Explicitly deferred until O14, O15, and O16 are functionally complete.
- O17-T01 planning specification completed on 2026-06-13 (docs/internal/phase-2m-uiux-revamp-planning-spec.md).
- O17-T02 public-surface revamp completed on 2026-06-13 (docs/internal/phase-2m-public-uiux-revamp-report.md).
- O17-T03 internal admin/agent revamp completed on 2026-06-13 (docs/internal/phase-2m-internal-uiux-revamp-report.md).
- O17-T04 is the next execution task.

Objective:
Apply design-system-first UI/UX overhaul only after workflow scope stabilizes.

Scope:
- Define final design system and information hierarchy based on completed features.
- Redesign public surfaces first, then internal admin and agent workspaces.
- Run regression and accessibility verification after redesign.
- Preserve existing feature behavior, auth boundaries, and workflow logic while upgrading presentation quality.

Affected files:
- src/app/*
- src/components/*
- src/app/globals.css
- docs/internal/*
- docs/ai-orchestrator/*

Database changes:
- None expected.

Backend changes:
- None except minimal support for UX-driven data presentation needs.

Frontend changes:
- Deep visual, interaction, responsive, and accessibility improvements over stable feature set.

Validation checks:
- git status --short
- npm run lint
- npx tsc --noEmit
- npm run test
- targeted UX regression scenarios

Definition of done:
- Stable, feature-complete surfaces have cohesive visual language and improved usability.
- No major workflow regression is introduced by redesign.

Definition of done:
- Server-action FormData parsing logic is isolated in pure helper module and covered by deterministic unit tests.
- Lint and typecheck remain green.