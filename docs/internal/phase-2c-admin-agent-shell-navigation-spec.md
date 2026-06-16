# Phase 2C Admin Dashboard Navigation + Internal Shell Foundation Specification

Date: 2026-06-02
Phase: 2C
Scope: Planning/specification only
Status: Draft for implementation planning

References:
- docs/auth/phase-2a-auth-access-integration-closure-report.md
- docs/auth/phase-2b-internal-user-management-closure-report.md
- docs/auth/phase-2b-4-6-admin-user-management-verification-report.md
- src/app/(internal)/admin/layout.tsx
- src/app/(internal)/admin/page.tsx
- src/app/(internal)/admin/users/page.tsx
- src/app/(internal)/agent/layout.tsx
- src/app/(internal)/agent/page.tsx
- src/components/auth/sign-out-button.tsx
- src/components/auth/auth-session-action.tsx
- src/components/layout/public-shell.tsx
- src/lib/auth/guards.ts
- src/config/routes.ts
- src/config/roles.ts
- package.json

## 1) Objective
Define a reusable internal shell foundation for Admin and Agent portals.

This specification covers:
- sidebar/topbar navigation foundation
- role-aware navigation behavior
- sign out placement for internal portals

This is planning only. No runtime implementation is included.

## 2) Current status
Confirmed baseline:
- Admin and Agent layouts are protected by server-side route guards.
- Admin and Agent dashboard pages are still placeholder shells.
- /admin/users exists and role assignment MVP works.
- SignOutButton exists.
- No reusable internal shell exists yet.
- No dashboard sidebar/topbar navigation framework exists yet.
- Permission-level RBAC resolver is not implemented yet.

## 3) Internal route structure
Current and future route map for shell planning:

Admin:
- /admin
- /admin/users
- /admin/projects (future)
- /admin/properties (future)
- /admin/agents (future)
- /admin/leads (future)
- /admin/bookings (future)
- /admin/settings (future)

Agent:
- /agent
- /agent/leads (future)
- /agent/bookings (future)
- /agent/customers (future)
- /agent/profile (future)

## 4) Shell architecture proposal
Expected reusable components:
- InternalShell
- InternalSidebar
- InternalTopbar
- InternalNavItem
- InternalUserMenu or simple SignOut section
- InternalBreadcrumbs later if needed

Recommended folders/files:
- src/components/internal/shell/internal-shell.tsx
- src/components/internal/shell/internal-sidebar.tsx
- src/components/internal/shell/internal-topbar.tsx
- src/config/internal-navigation.ts

## 5) Role-aware navigation
Define role-aware UI behavior:
- Admin shell uses admin navigation.
- Agent shell uses agent navigation.
- Do not show admin nav to agent.
- Do not show agent nav to admin unless explicitly approved.
- Navigation visibility is UI convenience only; route guards remain server-side source of truth.
- Permission-level visibility and granular action-level hiding come later.

## 6) Layout integration plan
Planned integration:
- Admin layout wraps children with InternalShell variant="admin".
- Agent layout wraps children with InternalShell variant="agent".
- Keep existing requireRole guard in admin/agent layouts.
- Do not remove route guards.
- Do not weaken auth protection.

## 7) Visual / UX direction
Design direction for implementation phase:
- modern 2026 SaaS
- clean premium fintech-inspired style with restrained glassmorphism
- dark/light compatible where practical
- compact readable sidebar
- clear active state
- simple topbar
- responsive baseline now; richer mobile drawer behavior can follow later

MVP priorities:
- clean layout
- route awareness
- readable navigation
- obvious sign out access
- no heavy motion/animation

## 8) Navigation items MVP
Admin MVP nav:
- Dashboard
- Users
- Projects (placeholder)
- Properties (placeholder)
- Leads (placeholder)
- Bookings (placeholder)
- Settings (placeholder)

Agent MVP nav:
- Dashboard
- Leads (placeholder)
- Bookings (placeholder)
- Customers (placeholder)
- Profile (placeholder)

Requirement:
- clearly label non-implemented destinations as placeholders.

## 9) Active route behavior
- Highlight active item by pathname.
- Support parent active state for nested paths.
- Do not treat active-state logic as authorization.
- Active-state implementation can use usePathname in client nav components or server-provided pathname if practical.

## 10) Sign out placement
- Place sign out in sidebar footer or topbar user area.
- Reuse existing SignOutButton.
- Avoid full profile dropdown in MVP unless very simple.
- Public header sign out can remain as-is for current phase.

## 11) Accessibility and responsive requirements
- Keyboard-accessible nav links.
- Proper aria labels for nav regions and controls.
- Clear focus-visible states.
- Mobile can use simple stacked/top nav fallback if drawer scope is too large for initial 2C slices.
- Avoid overbuilding mobile interactions before shell foundation is stable.

## 12) Security rules
- Do not trust nav visibility for authorization.
- Keep server-side route guards as final authority.
- No permission resolver yet.
- No middleware.
- No DB schema changes.
- No auth runtime changes.
- No public role promotion.

## 13) Implementation phases
- 2C.1 Internal shell/navigation spec approval
- 2C.2 config internal navigation
- 2C.3 InternalShell components
- 2C.4 Admin layout integration
- 2C.5 Agent layout integration
- 2C.6 placeholder page polish
- 2C.7 verification report

## 14) Test checklist
- ADMIN sees admin shell
- ADMIN sees Users nav
- ADMIN active /admin/users state works
- AGENT sees agent shell
- AGENT does not see admin nav
- CUSTOMER cannot access admin/agent routes
- unauthenticated user redirected to login
- Sign out works from internal shell
- Existing /admin/users still works
- Role assignment still works after shell integration

## 15) Exclusions
Out of scope for this planning phase:
- No implementation yet
- No DB schema changes
- No migrations
- No permission resolver
- No middleware
- No dashboard data widgets
- No projects/leads/bookings feature implementation
- No full profile dropdown
- No advanced responsive drawer unless separately approved

## 16) Final recommendation
Phase 2C.2 implementation can proceed after this specification is approved.
