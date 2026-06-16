# Task Backlog

Last updated: 2026-06-13
Owner: AI Orchestrator

## Priority model
- P0: blocking quality or security risk
- P1: core delivery enabler
- P2: feature delivery
- P3: optimization and polish

## Active backlog
| ID | Priority | Phase | Owner agent | Task | Scope boundary | Status |
| --- | --- | --- | --- | --- | --- | --- |
| O1-T01 | P0 | O1 | Documentation Agent | Create orchestrator docs set | Docs only, no runtime changes | Done |
| O2-T01 | P0 | O2 | Documentation Agent | Reconcile stale phase reports with current runtime | Docs alignment only | Done |
| O2-T02 | P0 | O2 | System Architect Agent | Mark placeholder routes by status in one source map | Mapping docs and route status only | Done |
| O3-T01 | P1 | O3 | QA Agent | Introduce baseline test framework and scripts | Minimal setup, no broad refactor | Done |
| O3-T02 | P1 | O3 | QA Agent | Add auth and role-guard critical path tests | Auth and guard flows only | Done |
| O4-T01 | P1 | O4 | QA Agent | Execute pending manual verification for admin users/projects | Existing admin modules only | Done |
| O4-T02 | P1 | O4 | Backend Agent | Patch defects from O4-T01 findings | Bug-fix scope only | Done |
| O5-T01 | P2 | O5 | Product Manager Agent | Define MVP acceptance criteria for leads slice | Requirement definition only | Done |
| O5-T02 | P2 | O5 | Backend Agent | Implement leads read and status update server logic | Leads only, no booking/doc scope | Done (read baseline) |
| O5-T03 | P2 | O5 | Frontend Agent | Replace one leads placeholder with operational page | Single vertical slice only | Done |
| O6-T01 | P2 | O6 | Product Manager Agent | Define booking and document MVP flow | Scope and acceptance only | Done |
| O6-T02 | P2 | O6 | Backend Agent | Implement booking transition primitives with audit | Booking only, no whatsapp | Done |
| O6-T03 | P2 | O6 | Frontend Agent | Build booking and document minimal operational screens | Minimal slice only | Done (read baseline) |
| O7-T01 | P2 | O7 | System Architect Agent | Define WhatsApp routing runtime boundary and event model | Architecture note only | Done |
| O7-T02 | P2 | O7 | Backend Agent | Implement inbound webhook baseline and queue assignment | Core inbound path only | Done |
| O7-T03 | P2 | O7 | Frontend Agent | Add internal queue and conversation operational view | Minimal operational UI only | Done |
| O8-T01 | P1 | O8 | DevOps Agent | Add CI workflow for lint, typecheck, and tests | Baseline quality gate only | Done |
| O8-T02 | P1 | O8 | QA Agent | Execute runtime verification follow-up for booking/document transitions and WhatsApp webhook baseline | Runtime verification only, no feature expansion | Done |
| O8-T03 | P1 | O8 | Backend Agent | Patch defects from O8-T02 findings | Bug-fix scope only | Done (no scoped defects) |
| O9-T01 | P2 | O9 | Product Manager Agent | Define Phase O9 admin project media/file-linking MVP acceptance | Scope definition only | Done |
| O9-T02 | P2 | O9 | Backend Agent | Add featured file lookup options to admin project form loaders | Admin projects module only | Done |
| O9-T03 | P2 | O9 | Frontend Agent | Expose featured file selector in admin project create/edit form | Admin projects module only | Done |
| O9-T04 | P2 | O9 | QA Agent | Verify featured file linking scenarios and publish verification report | Verification only | Done |
| O9-T05 | P2 | O9 | Backend Agent | Implement project_media attach/list/remove primitives with audit hooks | project_media relation only, no upload pipeline | Done |
| O9-T06 | P2 | O9 | Frontend Agent | Add project media list management UI in admin project edit flow | Admin projects module only | Done |
| O9-T07 | P2 | O9 | QA Agent | Execute Phase O9 closure verification and publish final report | Verification and documentation only | Done |
| O10-T01 | P1 | O10 | Product Manager Agent | Define admin users permission-resolver hardening acceptance criteria | Scope definition only | Done |
| O10-T02 | P1 | O10 | Backend Agent | Implement permission-level resolver and enforce in admin role-assignment service | Admin users module only | Done |
| O10-T03 | P1 | O10 | Frontend Agent | Reflect permission constraints in admin users UI actions and feedback | Admin users module only | Done |
| O10-T04 | P1 | O10 | QA Agent | Execute runtime verification for admin permission guardrails and role-change boundaries | Verification only | Done |
| O10-T05 | P1 | O10 | QA Agent | Add targeted automated tests for permission resolver and role policy enforcement | Test coverage only | Done |
| O11-T01 | P1 | O11 | System Architect Agent | Define canonical internal shell ownership and deprecate duplicate layout shell | Decision and docs only | Done |
| O11-T02 | P1 | O11 | Frontend Agent | Remove orphaned legacy internal shell components under src/components/layout | Internal shell only, no UX expansion | Done |
| O11-T03 | P1 | O11 | QA Agent | Validate admin internal routes render correctly after shell consolidation | Verification only | Done |
| O12-T01 | P1 | O12 | QA Agent | Define targeted automated coverage expansion for deterministic admin/internal helpers | Scope definition only | Done |
| O12-T02 | P1 | O12 | QA Agent | Add admin project mutation validation tests | src/lib/admin/projects validation only | Done |
| O12-T03 | P1 | O12 | QA Agent | Expand WhatsApp routing helper edge-case tests and verify gates | src/lib/internal/whatsapp routing only | Done |
| O13-T01 | P1 | O13 | System Architect Agent | Define testability seam for DB-coupled admin project server actions | Scope and architecture only | Done |
| O13-T02 | P1 | O13 | Backend Agent | Extract admin project FormData parser into pure helper module and wire server actions | Admin project server-actions only | Done |
| O13-T03 | P1 | O13 | QA Agent | Add parser unit tests and validate quality gates | Parser and tests only | Done |
| O14-T01 | P1 | O14 | Product Manager Agent | Define admin completion acceptance and reusable module boundaries | Admin-only planning and dependency map | Done |
| O14-T02 | P1 | O14 | Backend Agent | Implement admin properties and agents management primitives | Admin properties and agents domains only | Done |
| O14-T03 | P1 | O14 | Frontend Agent | Build admin properties, agents, and customers operational pages from reusable feature components | Admin-only UI composition, no public scope | Done |
| O14-T04 | P1 | O14 | Frontend Agent | Replace admin appointments, reports, and settings placeholders with functional baseline screens | Baseline operational screens only | Done |
| O14-T05 | P1 | O14 | Backend Agent | Upgrade admin leads, bookings, and documents from status tables to workflow-safe actions | Existing internal domains only, no redesign | Done |
| O14-T06 | P1 | O14 | QA Agent | Execute admin completion runtime verification and publish closure report | Verification only | Done |
| O15-T01 | P2 | O15 | Product Manager Agent | Define agent workspace completion acceptance and shared-component reuse rules | Agent-only planning, align with admin primitives | Done |
| O15-T02 | P2 | O15 | Frontend Agent | Implement agent customers, appointments, and profile baseline modules | Agent-only features, reuse admin/internal patterns | Done |
| O15-T03 | P2 | O15 | Backend Agent | Extend agent leads, bookings, and documents with real workflow actions | Agent-role scope only | Done |
| O15-T04 | P2 | O15 | QA Agent | Verify agent workspace completion in seeded runtime | Verification only | Done |
| O16-T01 | P2 | O16 | Product Manager Agent | Define customer/public funnel acceptance and decide customer account MVP vs defer | Public and customer scope definition only | Done |
| O16-T02 | P2 | O16 | Backend Agent | Implement public project discovery, inquiry capture, and book-viewing workflow primitives | Public funnel only | Done |
| O16-T03 | P2 | O16 | Frontend Agent | Replace public placeholders with real home, projects, project detail, contact, and book-viewing pages | Public-facing feature completion only | Done |
| O16-T04 | P2 | O16 | QA Agent | Verify public-to-internal funnel and customer-facing flows | Verification only | Done |
| O17-T01 | P3 | O17 | System Architect Agent | Define post-feature-freeze design-system and UI/UX revamp plan | No feature expansion | Done |
| O17-T02 | P3 | O17 | Frontend Agent | Execute deep UI/UX revamp for public surfaces using finalized feature set | UI/UX only | Done |
| O17-T03 | P3 | O17 | Frontend Agent | Execute deep UI/UX revamp for internal admin and agent surfaces | UI/UX only | Done |
| O17-T04 | P3 | O17 | QA Agent | Run regression, accessibility, and workflow verification after deep revamp | Verification only | Planned |

## Dispatch rules
- Only one in-progress task per owner agent at a time unless tasks are fully isolated.
- Every task must identify affected files before implementation starts.
- Every completed task must update progress-log.md and, if needed, decision-log.md.