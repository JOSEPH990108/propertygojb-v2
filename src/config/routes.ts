export const ROUTES = {
  public: {
    home: "/",
    projects: "/projects",
    projectDetails: (slug: string) => `/projects/${slug}`,
    bookViewing: "/book-viewing",
    contact: "/contact",
    about: "/about",
  },
  auth: {
    login: "/login",
    loginOauthError: "/login?error=oauth",
    loginUnknownRoleError: "/login?error=unknown-role",
    register: "/register",
    oauthCallback: "/oauth-callback",
    forgotPassword: "/forgot-password",
    verifyOtp: "/verify-otp",
  },
  admin: {
    dashboard: "/admin",
    users: "/admin/users",
    projects: "/admin/projects",
    properties: "/admin/properties",
    leads: "/admin/leads",
    agents: "/admin/agents",
    bookings: "/admin/bookings",
    customers: "/admin/customers",
    documents: "/admin/documents",
    appointments: "/admin/appointments",
    reports: "/admin/reports",
    settings: "/admin/settings",
  },
  agent: {
    dashboard: "/agent",
    leads: "/agent/leads",
    bookings: "/agent/bookings",
    appointments: "/agent/appointments",
    customers: "/agent/customers",
    documents: "/agent/documents",
    profile: "/agent/profile",
  },
} as const

export type AppRoutes = typeof ROUTES
