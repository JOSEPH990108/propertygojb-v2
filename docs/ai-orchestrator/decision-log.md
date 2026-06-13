# Decision Log

Last updated: 2026-06-13
Owner: System Architect Agent

## Decision records
| ID | Date | Status | Decision | Rationale |
| --- | --- | --- | --- | --- |
| D-001 | 2026-06-12 | Accepted | Use analyze-first orchestration workflow before coding | Prevent blind generation and reduce regression risk in existing codebase |
| D-002 | 2026-06-12 | Accepted | Preserve App Router route group structure for public, auth, and internal | Route ownership is already established and integrated with existing shell/auth behavior |
| D-003 | 2026-06-12 | Accepted | Keep server-side role guards as access-control source of truth | Navigation and client state are not sufficient authorization controls |
| D-004 | 2026-06-12 | Accepted | Adopt docs-first Phase O1 before runtime feature expansion | Existing implementation is broad and partially complete; coordination layer is required first |
| D-005 | 2026-06-12 | Accepted | Prioritize vertical slices (leads, bookings, documents) over broad placeholder expansion | Vertical slices produce operational value and verifiable progress |
| D-006 | 2026-06-12 | Accepted | Require migration impact notes for every future schema change | Protect data integrity and deployment safety |
| D-007 | 2026-06-12 | Accepted | Adopt Vitest for baseline automated tests | Fast setup with TypeScript support and minimal integration overhead |
| D-008 | 2026-06-12 | Accepted | Use GitHub Actions for baseline quality pipeline | Native repository integration for lint, typecheck, and test enforcement |
| D-009 | 2026-06-12 | Accepted | Deliver read-only operational slices before mutation workflows | Reduces risk while activating core internal visibility quickly |
| D-010 | 2026-06-12 | Accepted | Implement booking/document mutations as transaction-bound status updates with history/activity/audit writes | Keeps state transitions and observability consistent under failure conditions |
| D-011 | 2026-06-12 | Accepted | Implement WhatsApp inbound processing with idempotent webhook event keying and rule-based assignment fallback chain | Prevents duplicate processing and enforces deterministic routing baseline |
| D-012 | 2026-06-13 | Accepted | Centralize admin role-change RBAC in backend resolver and expose permission payload to UI | Prevent client/backend policy drift and keep role matrix enforcement server authoritative |
| D-013 | 2026-06-13 | Accepted | Use src/components/internal/shell as canonical internal shell and remove duplicate src/components/layout/internal-* implementation | Eliminates duplicate layout logic and reduces long-term UI/navigation divergence risk |
| D-014 | 2026-06-13 | Accepted | Extract FormData parsing for DB-coupled server actions into pure helper modules before adding parser tests | Keeps use-server actions compliant while enabling deterministic unit tests for request parsing logic |
| D-015 | 2026-06-13 | Accepted | Prioritize remaining delivery as Admin -> Agent -> Customer/Public, and defer deep UI/UX revamp until after feature completion | Current repo still has broad placeholder/simple surfaces; feature-complete reusable workflows should stabilize first so redesign is not wasted or repeatedly reworked |
| D-016 | 2026-06-13 | Accepted | Defer customer account MVP from O16 and close DQ-005 after public funnel closure | O16 value target is public discovery and demand capture handoff; customer self-serve workspace introduces additional auth/lifecycle scope beyond current risk budget |
| D-017 | 2026-06-13 | Accepted | Use ui-ux-pro-max as curated design reference input while keeping repository token/component architecture as O17 implementation source of truth | Generator-wide recommendations can drift to mismatched product patterns; curated domain and stack guidance with existing primitives reduces redesign risk and avoids feature regression |

## Open decisions queue
| ID | Date | Status | Topic | Required input |
| --- | --- | --- | --- | --- |
| DQ-001 | 2026-06-12 | Closed | Permission-level RBAC runtime enforcement approach | Resolved by D-012 and O10 implementation |
| DQ-002 | 2026-06-12 | Closed | Test framework and CI provider selection | Resolved by D-007 and D-008 |
| DQ-003 | 2026-06-12 | Open | Deployment target and environment promotion model | DevOps and product constraints |
| DQ-004 | 2026-06-12 | Closed | Duplicate internal shell consolidation strategy | Resolved by D-013 and O11 consolidation |
| DQ-005 | 2026-06-13 | Closed | Customer account MVP vs explicit defer after public funnel completion | Resolved by D-016 and O16 closure artifacts |

## Decision update policy
- Add a new row when a material architecture or policy choice is made.
- Do not rewrite historical rows; append new rows for reversals.
- Link related progress entries in progress-log.md when relevant.