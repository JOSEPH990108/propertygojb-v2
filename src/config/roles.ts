export const ROLES = [
  "super_admin",
  "admin",
  "manager",
  "agent",
  "customer",
] as const

export type Role = (typeof ROLES)[number]

export type AccessArea = "public" | "auth" | "admin" | "agent"

export type RoleAccessConfig = {
  areas: readonly AccessArea[]
  label: string
}

export const roleAccessConfig: Record<Role, RoleAccessConfig> = {
  super_admin: {
    label: "Super Admin",
    areas: ["public", "auth", "admin", "agent"],
  },
  admin: {
    label: "Admin",
    areas: ["public", "auth", "admin"],
  },
  manager: {
    label: "Manager",
    areas: ["public", "auth", "admin", "agent"],
  },
  agent: {
    label: "Agent",
    areas: ["public", "auth", "agent"],
  },
  customer: {
    label: "Customer",
    areas: ["public", "auth"],
  },
}
