import "server-only"

import { and, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm"

import { ROUTES } from "@/config/routes"
import { db } from "@/db"
import { roles, user } from "@/db/schema/identity-auth"
import {
  evaluateRoleChange,
  type AssignInternalRole,
  type AssignRoleCode,
  type RoleChangeFailureCode,
} from "@/lib/admin/users/role-policy"
import { writeInternalRoleChangeAudit } from "@/lib/admin/users/audit"
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

export type AssignInternalUserRoleInput = {
  targetUserId: string
  targetRole: AssignInternalRole | "SUPER_ADMIN" | string
  reasonNote: string
}

export type AssignInternalUserRoleSuccess = {
  ok: true
  targetUserId: string
  previousRole: AssignRoleCode
  newRole: AssignInternalRole
}

export type AssignInternalUserRoleFailure = {
  ok: false
  code: RoleChangeFailureCode | "AUDIT_WRITE_FAILED"
  message: string
}

export type AssignInternalUserRoleResult = AssignInternalUserRoleSuccess | AssignInternalUserRoleFailure

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

function normalizeAssignRole(value: unknown): AssignInternalRole | "SUPER_ADMIN" | null {
  if (typeof value !== "string") {
    return null
  }

  const normalized = value.trim().toUpperCase()
  switch (normalized) {
    case "CUSTOMER":
    case "AGENT":
    case "ADMIN":
    case "SUPER_ADMIN":
      return normalized
    default:
      return null
  }
}

function normalizeRoleCode(value: unknown): AssignRoleCode | null {
  if (typeof value !== "string") {
    return null
  }

  const normalized = value.trim().toUpperCase()
  switch (normalized) {
    case "CUSTOMER":
    case "AGENT":
    case "ADMIN":
    case "SUPER_ADMIN":
      return normalized
    default:
      return null
  }
}

function resolveActorUserId(value: unknown): string | null {
  if (!value || typeof value !== "object") {
    return null
  }

  const candidate = (value as { id?: unknown }).id
  return typeof candidate === "string" && candidate ? candidate : null
}

function buildFailure(
  code: AssignInternalUserRoleFailure["code"],
  message: string,
): AssignInternalUserRoleFailure {
  return {
    ok: false,
    code,
    message,
  }
}

class AuditWriteFailedError extends Error {
  constructor() {
    super("AUDIT_WRITE_FAILED")
    this.name = "AuditWriteFailedError"
  }
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

export function getAssignableRolesForActor(actorRole: "ADMIN" | "SUPER_ADMIN"): readonly AssignInternalRole[] {
  if (actorRole === "ADMIN") {
    return ["CUSTOMER", "AGENT"]
  }

  return ["CUSTOMER", "AGENT", "ADMIN"]
}

export async function assignInternalUserRole(
  input: AssignInternalUserRoleInput,
): Promise<AssignInternalUserRoleResult> {
  const normalizedTargetRole = normalizeAssignRole(input.targetRole)
  if (!normalizedTargetRole) {
    return buildFailure("INVALID_ROLE", "Target role is invalid.")
  }

  if (normalizedTargetRole === "SUPER_ADMIN") {
    return buildFailure(
      "SUPER_ADMIN_ASSIGNMENT_BLOCKED",
      "SUPER_ADMIN assignment is blocked in MVP.",
    )
  }

  const reasonNote = typeof input.reasonNote === "string" ? input.reasonNote.trim() : ""
  if (!reasonNote) {
    return buildFailure("REASON_REQUIRED", "Reason note is required.")
  }

  const targetUserId = typeof input.targetUserId === "string" ? input.targetUserId.trim() : ""
  if (!targetUserId) {
    return buildFailure("TARGET_NOT_FOUND", "Target user was not found.")
  }

  const authContext = await requireRole(["ADMIN", "SUPER_ADMIN"], {
    nextPath: ROUTES.admin.users,
  })

  const actorUserId = resolveActorUserId(authContext.user)
  if (!actorUserId) {
    return buildFailure("UNAUTHENTICATED", "Authentication is required.")
  }

  const actorRoleCode = normalizeRoleCode(authContext.roleCode)
  if (!actorRoleCode || (actorRoleCode !== "ADMIN" && actorRoleCode !== "SUPER_ADMIN")) {
    return buildFailure("FORBIDDEN", "You are not allowed to change roles.")
  }

  if (!db) {
    return buildFailure("FORBIDDEN", "Role change service is unavailable.")
  }

  try {
    return await db.transaction(async (tx) => {
      const target = await tx
        .select({
          id: user.id,
          roleCode: roles.code,
        })
        .from(user)
        .leftJoin(roles, eq(user.roleId, roles.id))
        .where(eq(user.id, targetUserId))
        .limit(1)

      const targetRecord = target[0]
      if (!targetRecord) {
        return buildFailure("TARGET_NOT_FOUND", "Target user was not found.")
      }

      if (actorUserId === targetRecord.id) {
        return buildFailure("SELF_ROLE_CHANGE_BLOCKED", "You cannot modify your own role.")
      }

      const previousRole = normalizeRoleCode(targetRecord.roleCode)
      if (!previousRole) {
        return buildFailure("ROLE_CHANGE_NOT_ALLOWED", "Current target role is not eligible for this action.")
      }

      const policy = evaluateRoleChange({
        actorRole: actorRoleCode,
        previousRole,
        targetRole: normalizedTargetRole,
      })

      if (!policy.allowed) {
        return buildFailure(policy.code, policy.message)
      }

      const targetRoleRecord = await tx
        .select({
          id: roles.id,
        })
        .from(roles)
        .where(eq(roles.code, normalizedTargetRole))
        .limit(1)

      const resolvedTargetRole = targetRoleRecord[0]
      if (!resolvedTargetRole?.id) {
        return buildFailure("INVALID_ROLE", "Target role is invalid.")
      }

      await tx
        .update(user)
        .set({
          roleId: resolvedTargetRole.id,
          updatedAt: new Date(),
        })
        .where(eq(user.id, targetUserId))

      try {
        await writeInternalRoleChangeAudit(tx, {
          actorUserId,
          actorRoleId: authContext.roleId,
          targetUserId,
          previousRole,
          newRole: normalizedTargetRole,
          reasonNote,
        })
      } catch {
        throw new AuditWriteFailedError()
      }

      return {
        ok: true,
        targetUserId,
        previousRole,
        newRole: normalizedTargetRole,
      } satisfies AssignInternalUserRoleSuccess
    })
  } catch (error) {
    if (error instanceof AuditWriteFailedError) {
      return buildFailure("AUDIT_WRITE_FAILED", "Role change audit write failed.")
    }

    return buildFailure("FORBIDDEN", "Role change request could not be processed.")
  }
}
