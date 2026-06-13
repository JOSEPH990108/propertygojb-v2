import { ROUTES } from "@/config/routes"

export type InternalPortal = "admin" | "agent"

export type InternalNavigationItem = {
  id: string
  label: string
  href: string
  iconKey?: string
  isPlaceholder: boolean
  description?: string
  matchPaths?: readonly string[]
}

// Internal navigation is UI convenience only.
// Authorization must always remain enforced by server-side route guards.
// Permission-level navigation visibility can be layered in a later phase.
export const ADMIN_INTERNAL_NAVIGATION: readonly InternalNavigationItem[] = [
  {
    id: "admin-dashboard",
    label: "Dashboard",
    href: ROUTES.admin.dashboard,
    iconKey: "layout-dashboard",
    isPlaceholder: false,
    matchPaths: [ROUTES.admin.dashboard],
  },
  {
    id: "admin-users",
    label: "Users",
    href: ROUTES.admin.users,
    iconKey: "users",
    isPlaceholder: false,
    matchPaths: [ROUTES.admin.users],
  },
  {
    id: "admin-projects",
    label: "Projects",
    href: ROUTES.admin.projects,
    iconKey: "building-2",
    isPlaceholder: false,
    matchPaths: [ROUTES.admin.projects],
  },
  {
    id: "admin-properties",
    label: "Properties",
    href: ROUTES.admin.properties,
    iconKey: "home",
    isPlaceholder: false,
    matchPaths: [ROUTES.admin.properties],
  },
  {
    id: "admin-leads",
    label: "Leads",
    href: ROUTES.admin.leads,
    iconKey: "user-round-search",
    isPlaceholder: false,
    matchPaths: [ROUTES.admin.leads],
  },
  {
    id: "admin-bookings",
    label: "Bookings",
    href: ROUTES.admin.bookings,
    iconKey: "calendar-check-2",
    isPlaceholder: false,
    matchPaths: [ROUTES.admin.bookings],
  },
  {
    id: "admin-documents",
    label: "Documents",
    href: ROUTES.admin.documents,
    isPlaceholder: false,
    matchPaths: [ROUTES.admin.documents],
  },
  {
    id: "admin-settings",
    label: "Settings",
    href: ROUTES.admin.settings,
    iconKey: "settings",
    isPlaceholder: false,
    matchPaths: [ROUTES.admin.settings],
  },
]

export const AGENT_INTERNAL_NAVIGATION: readonly InternalNavigationItem[] = [
  {
    id: "agent-dashboard",
    label: "Dashboard",
    href: ROUTES.agent.dashboard,
    iconKey: "layout-dashboard",
    isPlaceholder: false,
    matchPaths: [ROUTES.agent.dashboard],
  },
  {
    id: "agent-leads",
    label: "Leads",
    href: ROUTES.agent.leads,
    iconKey: "user-round-search",
    isPlaceholder: false,
    matchPaths: [ROUTES.agent.leads],
  },
  {
    id: "agent-bookings",
    label: "Bookings",
    href: ROUTES.agent.bookings,
    iconKey: "calendar-check-2",
    isPlaceholder: false,
    matchPaths: [ROUTES.agent.bookings],
  },
  {
    id: "agent-appointments",
    label: "Appointments",
    href: ROUTES.agent.appointments,
    iconKey: "calendar-check-2",
    isPlaceholder: false,
    matchPaths: [ROUTES.agent.appointments],
  },
  {
    id: "agent-documents",
    label: "Documents",
    href: ROUTES.agent.documents,
    isPlaceholder: false,
    matchPaths: [ROUTES.agent.documents],
  },
  {
    id: "agent-customers",
    label: "Customers",
    href: ROUTES.agent.customers,
    iconKey: "users",
    isPlaceholder: false,
    matchPaths: [ROUTES.agent.customers],
  },
  {
    id: "agent-profile",
    label: "Profile",
    href: ROUTES.agent.profile,
    iconKey: "circle-user",
    isPlaceholder: false,
    matchPaths: [ROUTES.agent.profile],
  },
]

export function getInternalNavigation(portal: InternalPortal): readonly InternalNavigationItem[] {
  return portal === "admin" ? ADMIN_INTERNAL_NAVIGATION : AGENT_INTERNAL_NAVIGATION
}
