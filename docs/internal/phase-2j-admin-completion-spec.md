# Phase 2J Admin Completion Specification

Date: 2026-06-13
Phase task: O14-T01
Status: Completed
Scope: Exact completion specification for admin workspace before deep UI/UX redesign

## 1. Admin Module List (Exact Current State + Completion Target)

| Module | Route(s) | Current state | Existing implementation anchor | Completion target for O14 |
| --- | --- | --- | --- | --- |
| Dashboard | /admin | Partial (card shell, stale "coming soon" badges) | src/app/(internal)/admin/page.tsx | Replace static cards with live module status + operational links + unresolved-count summary cards. |
| Users | /admin/users | Operational | src/app/(internal)/admin/users/page.tsx, src/components/admin/users/*, src/lib/admin/users/* | Keep as completed baseline; only regression-safe polish if needed. |
| Projects | /admin/projects, /admin/projects/new, /admin/projects/[id]/edit | Operational baseline | src/app/(internal)/admin/projects/*, src/components/admin/projects/*, src/lib/admin/projects/* | Keep as completed baseline; only regression-safe polish if needed. |
| Leads | /admin/leads | Operational visibility baseline | src/app/(internal)/admin/leads/page.tsx, src/lib/internal/leads/actions.ts, src/lib/internal/whatsapp/actions.ts | Upgrade from visibility to workflow actions (assignment + status + activity writes). |
| Bookings | /admin/bookings | Operational transition baseline | src/app/(internal)/admin/bookings/page.tsx, src/lib/internal/bookings/actions.ts, src/lib/internal/bookings/server-actions.ts | Upgrade to workflow-safe actions with explicit reason capture and richer mutation UX. |
| Documents | /admin/documents | Operational transition baseline | src/app/(internal)/admin/documents/page.tsx, src/lib/internal/documents/actions.ts, src/lib/internal/documents/server-actions.ts | Upgrade to workflow-safe actions with verification/rejection reason capture UX. |
| Properties | /admin/properties | Placeholder | src/app/(internal)/admin/properties/page.tsx | Replace with operational listing + create/edit baseline backed by new admin primitives. |
| Agents | /admin/agents | Placeholder | src/app/(internal)/admin/agents/page.tsx | Replace with operational agent management baseline backed by new admin primitives. |
| Customers | /admin/customers | Placeholder | src/app/(internal)/admin/customers/page.tsx | Replace with operational customer index/profile baseline using shared internal read models. |
| Appointments | /admin/appointments | Placeholder | src/app/(internal)/admin/appointments/page.tsx | Replace with appointment queue baseline page with status and ownership actions. |
| Reports | /admin/reports | Placeholder | src/app/(internal)/admin/reports/page.tsx | Replace with KPI/read-model baseline report screen (no heavy BI scope). |
| Settings | /admin/settings | Placeholder | src/app/(internal)/admin/settings/page.tsx | Replace with system setting and feature-flag baseline controls (role-safe writes). |

## 2. Reusable Component Map

### 2.1 Existing reusable admin components (already in use)

| Domain | Component | Role |
| --- | --- | --- |
| Users | src/components/admin/users/admin-users-table.tsx | Shared table renderer for admin users listing. |
| Users | src/components/admin/users/role-change-dialog.tsx | Role mutation interaction with server-policy enforcement feedback. |
| Users | src/components/admin/users/user-role-badge.tsx | Reusable role badge rendering. |
| Projects | src/components/admin/projects/admin-projects-table.tsx | Shared table renderer for project listing. |
| Projects | src/components/admin/projects/project-form.tsx | Reusable create/edit project form shell with field-error mapping. |
| Projects | src/components/admin/projects/project-media-manager.tsx | Reusable media relation manager for edit flow. |
| Projects | src/components/admin/projects/project-publish-badge.tsx | Publish-state badge. |
| Projects | src/components/admin/projects/project-status-badge.tsx | Project status badge. |

### 2.2 Required reusable components for completion (to be created in O14)

| Target component | Proposed path | Used by modules | Purpose |
| --- | --- | --- | --- |
| AdminDataTableShell | src/components/admin/shared/admin-data-table-shell.tsx | Leads, Bookings, Documents, Properties, Agents, Customers, Appointments | Shared table shell with empty/loading/error regions and consistent spacing/header slots. |
| AdminFilterBar | src/components/admin/shared/admin-filter-bar.tsx | Properties, Agents, Customers, Appointments, Reports | Shared filter/search form row with reset/apply behavior. |
| StatusAdvanceAction | src/components/admin/shared/status-advance-action.tsx | Leads, Bookings, Documents, Appointments | Shared action control for role-safe status transition submit pattern. |
| AuditReasonDialog | src/components/admin/shared/audit-reason-dialog.tsx | Leads, Bookings, Documents, Settings | Shared reason-note capture UX for sensitive mutations. |
| AdminModuleSummaryCards | src/components/admin/shared/admin-module-summary-cards.tsx | Dashboard, Reports | Shared KPI card group for module health and counts. |

### 2.3 Domain-specific components to build from shared map

| Domain | Proposed components |
| --- | --- |
| Properties | src/components/admin/properties/properties-table.tsx, src/components/admin/properties/property-form.tsx |
| Agents | src/components/admin/agents/agents-table.tsx, src/components/admin/agents/agent-form.tsx |
| Customers | src/components/admin/customers/customers-table.tsx, src/components/admin/customers/customer-profile-panel.tsx |
| Appointments | src/components/admin/appointments/appointments-table.tsx, src/components/admin/appointments/appointment-action-bar.tsx |
| Reports | src/components/admin/reports/reports-kpi-grid.tsx, src/components/admin/reports/reports-filter-panel.tsx |
| Settings | src/components/admin/settings/settings-section.tsx, src/components/admin/settings/feature-flag-table.tsx |

## 3. Backend Primitive Map

### 3.1 Existing primitives (already available)

| Domain | Primitive file | Core primitives |
| --- | --- | --- |
| Admin Users | src/lib/admin/users/actions.ts | listAdminUsers, assignInternalUserRole, getAssignableRolesForActor |
| Admin Users (server action) | src/lib/admin/users/server-actions.ts | assignInternalUserRoleAction |
| Admin Projects | src/lib/admin/projects/actions.ts | listAdminProjects, getAdminProjectFormOptions, getAdminProjectById, createAdminProject, updateAdminProject, listAdminProjectMedia, attachAdminProjectMedia, removeAdminProjectMedia |
| Admin Projects (server actions) | src/lib/admin/projects/server-actions.ts | createAdminProjectAction, updateAdminProjectAction, attachAdminProjectMediaAction, removeAdminProjectMediaAction |
| Internal Leads read model | src/lib/internal/leads/actions.ts | listWorkspaceLeads |
| Internal WhatsApp read model | src/lib/internal/whatsapp/actions.ts | listWorkspaceWhatsappOverview |
| Internal Bookings | src/lib/internal/bookings/actions.ts | listWorkspaceBookings, updateWorkspaceBookingStatus, canTransitionBookingStatus, resolveRoleNextBookingStatus |
| Internal Bookings (server action) | src/lib/internal/bookings/server-actions.ts | updateWorkspaceBookingStatusAction |
| Internal Documents | src/lib/internal/documents/actions.ts | listWorkspaceDocumentRequests, updateWorkspaceDocumentRequestStatus, canTransitionDocumentRequestStatus, resolveRoleNextDocumentRequestStatus |
| Internal Documents (server action) | src/lib/internal/documents/server-actions.ts | updateWorkspaceDocumentRequestStatusAction |
| WhatsApp webhook ingestion | src/lib/internal/whatsapp/webhook.ts | processInboundWhatsappWebhook |

### 3.2 Missing primitives required for admin completion

| Module | Required primitive set | Proposed file target |
| --- | --- | --- |
| Properties | listAdminProperties, getAdminPropertyById, createAdminProperty, updateAdminProperty, archiveAdminProperty | src/lib/admin/properties/actions.ts + src/lib/admin/properties/server-actions.ts |
| Agents | listAdminAgents, getAdminAgentById, createAdminAgent, updateAdminAgent, setAdminAgentActiveState | src/lib/admin/agents/actions.ts + src/lib/admin/agents/server-actions.ts |
| Customers | listAdminCustomers, getAdminCustomerById, listAdminCustomerActivities | src/lib/admin/customers/actions.ts |
| Appointments | listAdminAppointments, createAdminAppointment, updateAdminAppointmentStatus, assignAdminAppointmentOwner | src/lib/admin/appointments/actions.ts + src/lib/admin/appointments/server-actions.ts |
| Reports | getAdminKpiSummary, listAdminPipelineMetrics, listAdminOperationalAlerts | src/lib/admin/reports/actions.ts |
| Settings | listAdminSystemSettings, updateAdminSystemSetting, listAdminFeatureFlags, updateAdminFeatureFlagOverride | src/lib/admin/settings/actions.ts + src/lib/admin/settings/server-actions.ts |
| Leads workflow upgrade | updateAdminLeadStatus, assignAdminLeadOwner, addAdminLeadActivity | src/lib/internal/leads/actions.ts + src/lib/internal/leads/server-actions.ts |
| Bookings workflow upgrade | listAdminBookingTimeline, updateAdminBookingStatusWithReason | src/lib/internal/bookings/actions.ts + src/lib/internal/bookings/server-actions.ts |
| Documents workflow upgrade | listAdminDocumentVerificationTimeline, updateAdminDocumentRequestStatusWithReason | src/lib/internal/documents/actions.ts + src/lib/internal/documents/server-actions.ts |

## 4. Implementation Dependency Order (Strict)

1. Lock shared contracts first.
- Define shared admin action-state/result patterns and table/filter contracts under src/components/admin/shared and lib type exports.
- Reason: all remaining module UIs/actions depend on stable shape.

2. Build Properties + Agents backend primitives (O14-T02).
- Implement read/write/audit-safe primitives and server actions for properties and agents first.
- Reason: these are hard blockers for replacing two placeholder routes and for downstream customer/report joins.

3. Build shared admin UI primitives.
- Implement AdminDataTableShell, AdminFilterBar, StatusAdvanceAction, AuditReasonDialog, AdminModuleSummaryCards.
- Reason: reduces duplicate implementation when replacing six placeholder routes.

4. Replace Properties, Agents, Customers pages (O14-T03).
- Compose pages from shared components and newly available primitives.
- Customers should start read-first baseline and reuse filters/table shell.

5. Replace Appointments, Reports, Settings pages (O14-T04).
- Use read-first baseline for reports and settings, then add controlled writes where safe.
- Reason: these pages depend on prior shared components and some properties/agents/customer data context.

6. Upgrade Leads/Bookings/Documents workflow actions and integrate UI (O14-T05).
- Add missing mutation paths with reason-note capture and audit-safe wrappers.
- Bind upgraded actions to existing admin leads/bookings/documents pages.

7. Refresh dashboard module cards.
- Replace stale "coming soon" labels with live completion states and links.

8. Execute O14 closure verification (O14-T06).
- Run lint/typecheck/tests + seeded runtime scenarios across all admin modules.
- Publish phase closure report.

## 5. O14-T01 Acceptance

O14-T01 is complete when this spec is present and tracker files mark planning completion with explicit dependency order and module/component/primitive maps.
