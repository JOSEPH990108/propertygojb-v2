import "server-only"

import { and, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm"

import { ROUTES } from "@/config/routes"
import { db } from "@/db"
import { roles, user } from "@/db/schema/identity-auth"
import { requireRole } from "@/lib/auth/guards"

const ALLOWED_ROLE_FILTERS = ["CUSTOMER", "AGENT", "ADMIN", "SUPER_ADMIN"] as const

type AllowedRoleFilter = (typeof ALLOWED_ROLE_FILTERS)[number]

export type AdminUserListItem = {
  id: string
  name: string
  email: string
  phoneMasked: string | null
  roleCode: AllowedRoleFilter | null
  createdAt: string
  updatedAt: string
}

export type ListAdminUsersParams = {
  search?: string
  role?: AllowedRoleFilter | "ALL"
  page?: number
  pageSize?: number
}

export type ListAdminUsersResult = {
  users: AdminUserListItem[]
  search: string
  role: AllowedRoleFilter | "ALL"
  page: number
  pageSize: number
  total: number
}

function normalizeRoleFilter(value?: string): AllowedRoleFilter | "ALL" {
  if (!value) {
    return "ALL"
  }

  const normalized = value.trim().toUpperCase()
  return ALLOWED_ROLE_FILTERS.includes(normalized as AllowedRoleFilter)
    ? (normalized as AllowedRoleFilter)
    : "ALL"
}

function normalizePositiveInt(value: number | undefined, fallback: number, max: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback
  }

  const normalized = Math.trunc(value)
  if (normalized < 1) {
    return fallback
  }

  return Math.min(normalized, max)
}

function buildPhoneMask(phoneNumber: string | null): string | null {
  if (!phoneNumber) {
    return null
  }

  const digits = phoneNumber.replace(/\D/g, "")
  if (!digits) {
    return "***"
  }

  const tail = digits.slice(-4)
  return `***${tail}`
}

export async function listAdminUsers(params: ListAdminUsersParams = {}): Promise<ListAdminUsersResult> {
  await requireRole(["ADMIN", "SUPER_ADMIN"], {
    nextPath: ROUTES.admin.users,
  })

  if (!db) {
    return {
      users: [],
      search: "",
      role: "ALL",
      page: 1,
      pageSize: 20,
      total: 0,
    }
  }

  const search = typeof params.search === "string" ? params.search.trim() : ""
  const role = normalizeRoleFilter(params.role)
  const page = normalizePositiveInt(params.page, 1, 500)
  const pageSize = normalizePositiveInt(params.pageSize, 20, 100)

  const whereClauses: SQL<unknown>[] = []

  if (search) {
    const searchPattern = `%${search}%`
    whereClauses.push(
      or(
        ilike(user.name, searchPattern),
        ilike(user.email, searchPattern),
        ilike(user.phoneNumber, searchPattern),
      )!,
    )
  }

  if (role !== "ALL") {
    whereClauses.push(eq(roles.code, role))
  }

  const whereExpression =
    whereClauses.length === 0
      ? undefined
      : whereClauses.length === 1
        ? whereClauses[0]
        : and(...whereClauses)

  const [{ total }] = await db
    .select({
      total: sql<number>`count(*)`,
    })
    .from(user)
    .leftJoin(roles, eq(user.roleId, roles.id))
    .where(whereExpression)

  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      roleCode: roles.code,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    })
    .from(user)
    .leftJoin(roles, eq(user.roleId, roles.id))
    .where(whereExpression)
    .orderBy(desc(user.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize)

  return {
    users: rows.map((row) => {
      const roleCode = normalizeRoleFilter(row.roleCode ?? undefined)

      return {
        id: row.id,
        name: row.name,
        email: row.email,
        phoneMasked: buildPhoneMask(row.phoneNumber),
        roleCode: roleCode === "ALL" ? null : roleCode,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      }
    }),
    search,
    role,
    page,
    pageSize,
    total: Number(total ?? 0),
  }
}
