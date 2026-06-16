import "server-only"

import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { ROUTES } from "@/config/routes"
import { db } from "@/db"
import { auth } from "@/lib/auth/server"

export type GuardRoleCode = "CUSTOMER" | "AGENT" | "ADMIN" | "SUPER_ADMIN"

type GuardContextBase = {
  session: unknown
  user: unknown
  roleCode?: GuardRoleCode
  roleId?: string
  isAuthenticated: boolean
}

export type AuthContext = GuardContextBase

export type GuardOptions = {
  nextPath?: string
}

function normalizeRoleCode(value: unknown): GuardRoleCode | undefined {
  if (typeof value !== "string") {
    return undefined
  }

  const normalized = value.trim().toUpperCase()
  switch (normalized) {
    case "CUSTOMER":
    case "AGENT":
    case "ADMIN":
    case "SUPER_ADMIN":
      return normalized
    default:
      return undefined
  }
}

export function getRoleHomePath(roleCode?: GuardRoleCode): string {
  switch (roleCode) {
    case "CUSTOMER":
      return ROUTES.public.home
    case "AGENT":
      return ROUTES.agent.dashboard
    case "ADMIN":
    case "SUPER_ADMIN":
      return ROUTES.admin.dashboard
    default:
      return ROUTES.auth.loginUnknownRoleError
  }
}

export function getLoginRedirectPath(nextPath?: string): string {
  if (!nextPath) {
    return ROUTES.auth.login
  }

  const normalizedPath = nextPath.trim()
  if (!normalizedPath) {
    return ROUTES.auth.login
  }

  // Allow only safe internal paths to avoid open redirect behavior.
  const lower = normalizedPath.toLowerCase()
  if (!normalizedPath.startsWith("/") || normalizedPath.startsWith("//") || /^[a-z][a-z\d+\-.]*:/.test(lower)) {
    return ROUTES.auth.login
  }

  return `${ROUTES.auth.login}?next=${encodeURIComponent(normalizedPath)}`
}

export async function resolveUserRoleFromDb(userId: unknown): Promise<{ roleCode?: GuardRoleCode; roleId?: string }> {
  if (typeof userId !== "string" || !userId || !db) {
    return {}
  }

  const userRecord = await db.query.user.findFirst({
    where: (table, { eq }) => eq(table.id, userId),
    columns: {
      roleId: true,
    },
  })

  if (!userRecord?.roleId) {
    return {}
  }

  const roleId = userRecord.roleId
  if (typeof roleId !== "string" || !roleId) {
    return {}
  }

  const roleRecord = await db.query.roles.findFirst({
    where: (table, { eq }) => eq(table.id, roleId),
    columns: {
      code: true,
    },
  })

  const roleCode = normalizeRoleCode(roleRecord?.code)
  if (!roleCode) {
    return {
      roleId,
    }
  }

  return {
    roleCode,
    roleId,
  }
}

export async function getCurrentAuthContext(): Promise<AuthContext> {
  const requestHeaders = await headers()
  const sessionResult = await auth.api.getSession({
    headers: requestHeaders,
  })

  if (!sessionResult?.session || !sessionResult.user) {
    return {
      session: null,
      user: null,
      roleCode: undefined,
      roleId: undefined,
      isAuthenticated: false,
    }
  }

  const sessionUser = sessionResult.user as { id?: unknown }
  const resolvedRole = await resolveUserRoleFromDb(sessionUser.id)

  return {
    session: sessionResult.session,
    user: sessionResult.user,
    roleCode: resolvedRole.roleCode,
    roleId: resolvedRole.roleId,
    isAuthenticated: true,
  }
}

export async function requireAuth(options?: GuardOptions): Promise<AuthContext> {
  const authContext = await getCurrentAuthContext()

  if (!authContext.isAuthenticated) {
    redirect(getLoginRedirectPath(options?.nextPath))
  }

  if (!authContext.roleCode) {
    redirect(ROUTES.auth.loginUnknownRoleError)
  }

  return authContext
}

export async function requireRole(
  allowedRoles: readonly GuardRoleCode[],
  options?: GuardOptions,
): Promise<AuthContext> {
  const authContext = await getCurrentAuthContext()

  if (!authContext.isAuthenticated) {
    redirect(getLoginRedirectPath(options?.nextPath))
  }

  if (!authContext.roleCode) {
    redirect(ROUTES.auth.loginUnknownRoleError)
  }

  if (!allowedRoles.includes(authContext.roleCode)) {
    redirect(getRoleHomePath(authContext.roleCode))
  }

  return authContext
}

export async function redirectAuthenticatedUserByRole(
  options?: GuardOptions,
): Promise<null> {
  void options

  const authContext = await getCurrentAuthContext()

  if (!authContext.isAuthenticated) {
    return null
  }

  if (!authContext.roleCode) {
    redirect(ROUTES.auth.loginUnknownRoleError)
  }

  redirect(getRoleHomePath(authContext.roleCode))
}