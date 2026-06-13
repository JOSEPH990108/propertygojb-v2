# System Map

Last updated: 2026-06-13

## Folder structure summary
- src/app: App Router route groups and API handlers
- src/components: UI primitives and feature components
- src/lib: Auth, admin services, and shared runtime helpers
- src/config: Routes, navigation, roles
- src/db: Drizzle schema, relations, seeds, and scripts
- drizzle: Generated SQL migrations and snapshots
- docs/auth: Auth phase specs and verification reports
- docs/internal: Internal/admin phase specs and verification reports
- docs/database: Database plan, specs, reports, and decisions

## Module list
### Frontend route modules
- Public portal: home, projects, project detail, contact, about, book-viewing
- Auth portal: login, register, verify-otp, forgot-password, oauth-callback
- Internal admin portal: dashboard, users, projects, plus multiple placeholders
- Internal agent portal: dashboard and placeholder sub-pages

### Backend/runtime modules
- Auth core: better-auth server/client/session/env/guards
- OTP services: request, verify, phone normalization, policy, provider, rate limiting, audit
- Admin users: listing, role policy, role assignment action, audit
- Admin projects: listing/filtering, create/edit actions, validation, slug logic, audit
- Internal leads: role-scoped read listing and workspace snapshot
- Internal bookings: role-scoped read listing, transition policy, and status mutation actions
- Internal documents: role-scoped read listing, request transition policy, and mutation actions
- Internal WhatsApp: queue/conversation snapshot plus inbound webhook processing and assignment routing

### Database modules
- identity-auth
- lookups
- geo
- files
- catalog
- inventory
- crm-leads
- whatsapp-routing
- bookings
- documents
- otp
- governance-rbac
- audit
- settings-flags

## Database table summary
### Identity and auth
roles, users, session, account, verification

### Catalog and inventory
developers, projects, project_phases, project_towers, project_layouts, project_media, project_nearby_places, project_amenities, project_tags, units, pricing_snapshots

### Leads and routing
lead_sources, leads, inquiries, lead_assignments, lead_activities, lead_status_history, whatsapp_agent_queues, whatsapp_agent_queue_members, whatsapp_assignment_rules, whatsapp_conversations, whatsapp_messages, whatsapp_webhook_events, whatsapp_delivery_events

### Booking and documents
bookings, booking_units, booking_participants, booking_status_history, booking_payments, booking_activities, document_types, document_requests, document_submissions, document_verification_logs, document_access_logs

### Governance and platform
permission_groups, permissions, role_permissions, user_permissions, audit_logs, auth_audit_logs, admin_action_approvals, system_settings, feature_flags, feature_flag_overrides

### OTP
otp_challenges

## API route summary
- /api/auth/[...all] (better-auth handler)
- /api/auth/otp/request
- /api/auth/otp/verify
- /api/whatsapp/webhook

Status: Auth APIs implemented; WhatsApp inbound webhook API baseline is now implemented.

## UI route and page summary
### Public
- /, /projects, /projects/[slug], /book-viewing, /contact, /about
Status: Mostly placeholder content.

### Auth
- /login, /register, /verify-otp, /forgot-password, /oauth-callback
Status: Login/register/verify flows wired for OAuth and OTP; forgot-password remains placeholder-level.

### Internal admin
- /admin, /admin/users, /admin/projects, /admin/projects/new, /admin/projects/[id]/edit, /admin/leads, /admin/bookings, /admin/documents, and additional placeholder routes.
Status: Users and Projects implemented; leads plus bookings/documents now have operational baseline with status transition controls.

### Internal agent
- /agent plus leads/bookings/appointments/customers/documents/profile routes.
Status: Leads plus bookings/documents now have operational baseline with role-scoped transition controls; other routes remain placeholder-first.

## Auth flow summary
1. User starts in /login or /register.
2. OAuth path uses better-auth social sign-in and callback.
3. OTP path calls /api/auth/otp/request and /api/auth/otp/verify.
4. Session is issued by Better Auth.
5. Role resolved from DB and redirected to area home.
6. Admin and agent route access enforced by server-side requireRole.

## Dependencies and integration points
- Better Auth <-> Drizzle adapter <-> PostgreSQL
- App Router pages <-> server helpers in src/lib/admin/*
- Server actions <-> Drizzle transactions <-> audit logs
- Route constants and portal navigation shared from src/config

## Known risks and missing pieces
1. Large number of placeholder routes across public/admin/agent surfaces.
2. CI and tests are baseline-only and currently cover a subset of logic.
3. Booking/document mutation and webhook routing baselines are implemented, but deeper workflow automation and robustness checks are still pending.
4. API surface beyond auth remains minimal and should expand with additional business-domain endpoints.