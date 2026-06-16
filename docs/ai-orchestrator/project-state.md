# Project State

Last scan date: 2026-06-13
Scan mode: Repository inspection with implementation reconciliation

## High-level summary
PropertyGo JB v2 is an in-progress full-stack application with real implementation in auth/access, admin users management, admin projects management, and a rich database foundation. Admin projects foundation manual verification and bug-fix loop are now completed, and duplicate internal shell code was consolidated in O11; large parts of public, agent, and business modules remain placeholder-first.

## Detected stack
- Next.js App Router + React 19 + TypeScript
- PostgreSQL + Drizzle ORM + drizzle-kit migrations
- Better Auth with Google OAuth and phone OTP plugin
- Tailwind CSS + shadcn/ui

## Implementation status matrix

| Area | Status | Notes |
|---|---|---|
| Database schema and relations | Completed | Wide domain model across auth, catalog, inventory, leads, whatsapp, bookings, documents, governance |
| Database migrations | Completed | drizzle 0000 through 0004 present |
| Database seeds | Completed | Ordered seed orchestration with environment guards |
| Auth runtime (OAuth + OTP + session) | Completed (MVP) | Better Auth integrated, OTP request/verify endpoints live |
| Route guards (admin/agent/auth redirects) | Completed (MVP) | Server-side requireRole and auth redirects in layouts/pages |
| Internal shell/navigation | Completed | Shared shell with portal-scoped navigation; legacy duplicate shell files under src/components/layout/internal-* were removed in O11 |
| Admin users management | Completed | Listing and role assignment implemented with backend resolver hardening, frontend permission alignment, runtime verification, and targeted resolver-policy automated coverage completed in O10 |
| Admin projects management | Partially completed (Phase O9 baseline closed) | Listing, filtering, create/edit, validation, audit implemented and manually verified; featured-file create/edit validation flow verified; project_media backend attach/list/remove primitives and admin edit-page media manager UI are implemented and closure-verified; upload pipeline remains out of scope and pending future phase |
| Public website pages | Partially completed | Routes exist, most are placeholders |
| Agent portal features | Partially completed | Leads operational visibility plus booking/document transition controls are implemented |
| Leads runtime module | Partially completed | Role-scoped read-only listing and WhatsApp snapshot views implemented |
| Bookings runtime module | Partially completed (runtime-verified baseline) | Read visibility plus transaction-safe status transitions and audit hooks implemented; admin/agent transition paths manually verified |
| Documents runtime module | Partially completed (runtime-verified baseline) | Read visibility plus request status transitions and verification/audit hooks implemented; admin/agent transition paths manually verified |
| WhatsApp runtime module | Partially completed (runtime-verified baseline) | Queue snapshot plus inbound webhook capture and assignment baseline implemented; success/duplicate/invalid payload webhook runtime paths verified |
| Business API layer beyond auth | Partially completed | Inbound WhatsApp webhook endpoint implemented; broader domain APIs remain pending |
| Automated tests | Partially completed | Vitest now covers auth phone normalization, auth guard redirects, admin users role policy, admin project mutation parsing/validation, and booking/document/whatsapp transition/routing helpers |
| CI/CD pipeline workflows | Partially completed | GitHub Actions quality workflow added |
| SDLC governance docs in docs/ai-sdlc | Completed (baseline) | Governance files populated with operational templates/rules |

## Implemented evidence highlights
- Auth runtime and OTP policy: src/lib/auth/server.ts, src/lib/auth/otp/*
- Role guards: src/lib/auth/guards.ts
- Auth API routes: src/app/api/auth/*
- Admin users: src/app/(internal)/admin/users/page.tsx, src/lib/admin/users/*
- Admin projects: src/app/(internal)/admin/projects/*, src/lib/admin/projects/*, src/components/admin/projects/project-form.tsx
- Admin projects verification evidence: docs/internal/phase-2d-admin-projects-verification-report.md
- Admin project file-linking verification evidence: docs/internal/phase-2e-admin-project-media-linking-verification-report.md
- Admin project media closure verification evidence: docs/internal/phase-2e-admin-project-media-closure-verification-report.md
- O12 targeted test expansion evidence: docs/internal/phase-2h-targeted-test-coverage-expansion-report.md
- O8 runtime follow-up evidence: docs/internal/phase-o8-runtime-verification-follow-up-report.md
- Leads read baseline: src/app/(internal)/admin/leads/page.tsx, src/app/(internal)/agent/leads/page.tsx, src/lib/internal/leads/actions.ts
- Bookings/documents runtime baseline: src/app/(internal)/admin/bookings/page.tsx, src/app/(internal)/agent/bookings/page.tsx, src/app/(internal)/admin/documents/page.tsx, src/app/(internal)/agent/documents/page.tsx, src/lib/internal/bookings/actions.ts, src/lib/internal/documents/actions.ts
- WhatsApp snapshot baseline: src/lib/internal/whatsapp/actions.ts
- WhatsApp inbound baseline: src/app/api/whatsapp/webhook/route.ts, src/lib/internal/whatsapp/webhook.ts, src/lib/internal/whatsapp/routing.ts
- Test baseline: vitest.config.ts, src/lib/admin/projects/slug.test.ts, src/lib/admin/projects/form-parser.test.ts, src/lib/admin/projects/validation.test.ts, src/lib/admin/users/role-policy.test.ts, src/lib/auth/otp/phone.test.ts, src/lib/auth/guards.test.ts, src/lib/internal/bookings/transitions.test.ts, src/lib/internal/documents/transitions.test.ts, src/lib/internal/whatsapp/routing.test.ts
- CI baseline: .github/workflows/quality.yml
- DB schema index: src/db/schema/index.ts
- Migrations journal: drizzle/meta/_journal.json

## Technical debt and structure risks
1. Placeholder breadth can hide actual delivery readiness.
2. CI and tests are baseline-only and need broader coverage for critical flows.
3. Booking/document mutations and inbound webhook routing baseline are now runtime-verified for core paths, but deeper edge-case and production-hardening checks remain pending.
4. Root README and app metadata still carry starter defaults, reducing onboarding clarity.

## Unknowns requiring future inspection
- Deployment target configuration and rollout strategy.
- Production observability, alerting, and incident runbooks.
- Non-local environment management policy and secret rotation policy.
- Performance and security testing baseline.