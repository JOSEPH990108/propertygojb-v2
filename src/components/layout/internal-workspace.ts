import {
  type NavigationItem,
  adminNavigation,
  agentNavigation,
} from "@/config/navigation"
import { ROUTES } from "@/config/routes"

export type InternalArea = "admin" | "agent" | "unknown"

export function resolveInternalArea(pathname: string): InternalArea {
  if (pathname.startsWith("/admin")) {
    return "admin"
  }

  if (pathname.startsWith("/agent")) {
    return "agent"
  }

  return "unknown"
}

export function getInternalNavigation(area: InternalArea): readonly NavigationItem[] {
  if (area === "admin") {
    return adminNavigation
  }

  if (area === "agent") {
    return agentNavigation
  }

  return []
}

export function getInternalWorkspaceLabel(area: InternalArea): string {
  if (area === "admin") {
    return "Admin Workspace"
  }

  if (area === "agent") {
    return "Agent Workspace"
  }

  return "Internal Workspace"
}

export function getInternalAreaLabel(area: InternalArea): string {
  if (area === "admin") {
    return "Admin"
  }

  if (area === "agent") {
    return "Agent"
  }

  return "Internal"
}

export function getSwitchWorkspaceTarget(area: InternalArea) {
  if (area === "admin") {
    return {
      href: ROUTES.agent.dashboard,
      label: "Switch to Agent",
    }
  }

  if (area === "agent") {
    return {
      href: ROUTES.admin.dashboard,
      label: "Switch to Admin",
    }
  }

  return null
}