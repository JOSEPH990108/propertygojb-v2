# Phase 2K Agent Workspace Completion Specification

Date: 2026-06-13
Phase task: O15-T01
Status: Completed
Scope: Exact completion specification for agent workspace after O14 admin closure

## 1. Agent Module List (Current State + Completion Target)

| Module | Route(s) | Current state | Existing implementation anchor | Completion target for O15 |
| --- | --- | --- | --- | --- |
| Dashboard | /agent | Partial | src/app/(internal)/agent/page.tsx | Replace static status cards with live workload summary from leads/bookings/documents/customers. |
| Leads | /agent/leads | Operational workflow baseline | src/app/(internal)/agent/leads/page.tsx, src/lib/internal/leads/* | Keep workflow-safe transitions; add reason-note UX and richer activity visibility. |
| Bookings | /agent/bookings | Operational workflow baseline | src/app/(internal)/agent/bookings/page.tsx, src/lib/internal/bookings/* | Keep transition baseline; add tighter action guidance and timeline visibility. |
| Documents | /agent/documents | Operational workflow baseline | src/app/(internal)/agent/documents/page.tsx, src/lib/internal/documents/* | Keep transition baseline; add verification context and reason-note UX where required. |
| Customers | /agent/customers | Placeholder | src/app/(internal)/agent/customers/page.tsx | Replace with assigned-customer operational list/profile baseline using shared internal read models. |
| Appointments | /agent/appointments | Placeholder | src/app/(internal)/agent/appointments/page.tsx | Replace with appointment queue baseline derived from lead workflow + ownership focus. |
| Profile | /agent/profile | Placeholder | src/app/(internal)/agent/profile/page.tsx | Replace with agent profile visibility and baseline update controls for contact/professional fields. |

## 2. Reuse and Component Strategy

### 2.1 Existing reusable primitives to reuse directly

| Domain | Existing primitive/component | Reuse rule for O15 |
| --- | --- | --- |
| Shared internal shell | src/components/internal/shell/* | Preserve layout/nav semantics; no shell forking. |
| Lead workflows | src/lib/internal/leads/actions.ts, src/lib/internal/leads/server-actions.ts | Reuse role-scoped transition policy and actions for agent pages. |
| Booking workflows | src/lib/internal/bookings/actions.ts, src/lib/internal/bookings/server-actions.ts | Reuse transition actions; avoid duplicate booking mutation services. |
| Document workflows | src/lib/internal/documents/actions.ts, src/lib/internal/documents/server-actions.ts | Reuse transition actions; keep role-safe constraints centralized. |
| WhatsApp overview | src/lib/internal/whatsapp/actions.ts | Reuse queue/conversation read models for agent visibility cards. |
| Admin table patterns | src/components/admin/* (table + filter patterns) | Reuse table/filter composition patterns, adapted for agent scope. |

### 2.2 New reusable components required in O15

| Target component | Proposed path | Used by modules | Purpose |
| --- | --- | --- | --- |
| AgentDataTableShell | src/components/agent/shared/agent-data-table-shell.tsx | Customers, Appointments, Profile activities | Shared agent table shell with empty/error blocks and consistent action slots. |
| AgentFilterBar | src/components/agent/shared/agent-filter-bar.tsx | Customers, Appointments | Shared search/filter bar tuned for assigned-scope operations. |
| AgentSummaryCards | src/components/agent/shared/agent-summary-cards.tsx | Dashboard, Appointments, Customers | Shared workload KPI cards for assigned leads/bookings/documents/customers. |
| AgentStatusAdvanceAction | src/components/agent/shared/agent-status-advance-action.tsx | Leads, Bookings, Documents, Appointments | Shared role-aware status action control with reason-note support. |

## 3. Backend Primitive Map for O15

### 3.1 Existing backend already sufficient for initial O15 usage

| Area | Primitive file | Existing support |
| --- | --- | --- |
| Leads | src/lib/internal/leads/actions.ts | list + workflow-safe status transitions with role checks and audit/history writes |
| Leads action bridge | src/lib/internal/leads/server-actions.ts | FormData transition action with cache revalidation |
| Bookings | src/lib/internal/bookings/actions.ts | list + role-safe booking transitions |
| Documents | src/lib/internal/documents/actions.ts | list + role-safe document request transitions |
| WhatsApp | src/lib/internal/whatsapp/actions.ts | queue/conversation workload read model |

### 3.2 Missing backend primitives to complete O15

| Module | Required primitive set | Proposed file target |
| --- | --- | --- |
| Agent customers | listAgentCustomers, getAgentCustomerProfile, listAgentCustomerActivities | src/lib/agent/customers/actions.ts |
| Agent appointments | listAgentAppointments, setAgentAppointmentStatus, rescheduleAgentAppointment | src/lib/agent/appointments/actions.ts + src/lib/agent/appointments/server-actions.ts |
| Agent profile | getAgentProfile, updateAgentProfileBasics, updateAgentAvailability | src/lib/agent/profile/actions.ts + src/lib/agent/profile/server-actions.ts |
| Workflow UX enhancement | reason-note capable agent transition wrappers (leads/bookings/documents) | extend existing src/lib/internal/*/server-actions.ts as needed |

## 4. Implementation Dependency Order (Strict)

1. Lock agent completion contract (this spec) and tracker state.
2. Implement agent customers baseline page + primitives (O15-T02 start).
3. Implement agent appointments baseline page + primitives (same slice as O15-T02).
4. Implement agent profile baseline page + primitives (same slice as O15-T02).
5. Upgrade leads/bookings/documents agent UX with richer workflow controls and reason-note capture where required (O15-T03).
6. Refresh /agent dashboard using live workload cards from reused read models.
7. Execute O15 runtime verification and publish closure report (O15-T04).

## 5. O15-T01 Acceptance

O15-T01 is complete when this specification exists and tracker artifacts are updated with:
- explicit agent module completion targets,
- exact reusable-component/backend primitive reuse strategy,
- strict implementation dependency order for O15-T02 through O15-T04.
