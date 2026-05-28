import { ROUTES } from "@/config/routes"

export type ProductArea = "public" | "admin" | "agent"

export type NavigationItem = {
  title: string
  href: string
  description?: string
}

export const publicNavigation: readonly NavigationItem[] = [
  { title: "Home", href: ROUTES.public.home },
  { title: "Projects", href: ROUTES.public.projects },
  { title: "Book Viewing", href: ROUTES.public.bookViewing },
  { title: "Contact", href: ROUTES.public.contact },
  { title: "About", href: ROUTES.public.about },
]

export const adminNavigation: readonly NavigationItem[] = [
  { title: "Dashboard", href: ROUTES.admin.dashboard },
  { title: "Projects", href: ROUTES.admin.projects },
  { title: "Properties", href: ROUTES.admin.properties },
  { title: "Agents", href: ROUTES.admin.agents },
  { title: "Bookings", href: ROUTES.admin.bookings },
  { title: "Customers", href: ROUTES.admin.customers },
  { title: "Documents", href: ROUTES.admin.documents },
  { title: "Appointments", href: ROUTES.admin.appointments },
  { title: "Reports", href: ROUTES.admin.reports },
  { title: "Settings", href: ROUTES.admin.settings },
]

export const agentNavigation: readonly NavigationItem[] = [
  { title: "Dashboard", href: ROUTES.agent.dashboard },
  { title: "Leads", href: ROUTES.agent.leads },
  { title: "Bookings", href: ROUTES.agent.bookings },
  { title: "Appointments", href: ROUTES.agent.appointments },
  { title: "Customers", href: ROUTES.agent.customers },
  { title: "Documents", href: ROUTES.agent.documents },
  { title: "Profile", href: ROUTES.agent.profile },
]

export const navigationByArea = {
  public: publicNavigation,
  admin: adminNavigation,
  agent: agentNavigation,
} satisfies Record<ProductArea, readonly NavigationItem[]>
