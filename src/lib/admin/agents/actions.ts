import "server-only"

import { randomUUID } from "crypto"

import { and, desc, eq, ilike, isNotNull, isNull, ne, or, sql, type SQL } from "drizzle-orm"

import { ROUTES } from "@/config/routes"
import { auditLogs } from "@/db/schema/audit"
import { db } from "@/db"
import { roles, user } from "@/db/schema/identity-auth"
import { requireRole } from "@/lib/auth/guards"

const AGENT_STATE_VALUES = ["ALL", "ACTIVE", "INACTIVE"] as const

type AgentStateFilter = (typeof AGENT_STATE_VALUES)[number]

type InternalRoleCode = "CUSTOMER" | "AGENT" | "ADMIN" | "SUPER_ADMIN"

export type AgentFieldErrors = Partial<Record<string, string>>

export type AdminAgentListItem = {
  id: string
  name: string
  email: string
  phoneMasked: string | null
  roleCode: InternalRoleCode | null
  isActive: boolean
  renNumber: string | null
  agencyName: string | null
  nationality: string | null
  createdAt: string
  updatedAt: string
}

export type ListAdminAgentsParams = {
  search?: string
  state?: AgentStateFilter | string
  page?: number
  pageSize?: number
}

export type ListAdminAgentsResult = {
  agents: AdminAgentListItem[]
  search: string
  state: AgentStateFilter
  page: number
  pageSize: number
  total: number
}

export type AdminAgentEditable = {
  id: string
  name: string
  email: string
  phoneNumber: string | null
  roleCode: InternalRoleCode | null
  isActive: boolean
  renNumber: string | null
  agencyName: string | null
  nationality: string | null
  onboardingCompleted: boolean
  createdAt: string
  updatedAt: string
}

export type GetAdminAgentByIdResult =
  | {
      ok: true
      agent: AdminAgentEditable
    }
  | {
      ok: false
      code: "VALIDATION_FAILED" | "AGENT_NOT_FOUND"
      message: string
      fieldErrors?: AgentFieldErrors
    }

export type AdminAgentMutationFailureCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "VALIDATION_FAILED"
  | "AGENT_NOT_FOUND"
  | "LOOKUP_NOT_FOUND"
  | "EMAIL_ALREADY_EXISTS"
  | "PHONE_ALREADY_EXISTS"
  | "CREATE_FAILED"
  | "UPDATE_FAILED"
  | "ACTIVE_STATE_UPDATE_FAILED"

export type AdminAgentMutationInput = {
  agentUserId?: unknown
  name?: unknown
  email?: unknown
  phoneNumber?: unknown
  renNumber?: unknown
  agencyName?: unknown
  nationality?: unknown
  reasonNote?: unknown
}

export type SetAdminAgentActiveStateInput = {
  agentUserId: unknown
  isActive: unknown
  reasonNote?: unknown
}

export type AdminAgentMutationSuccess = {
  ok: true
  agentUserId: string
}

export type AdminAgentMutationFailure = {
  ok: false
  code: AdminAgentMutationFailureCode
  message: string
  fieldErrors?: AgentFieldErrors
}

export type AdminAgentMutationResult =
  | AdminAgentMutationSuccess
  | AdminAgentMutationFailure

function resolveActorUserId(value: unknown): string | null {
  if (!value || typeof value !== "object") {
    return null
  }

  const candidate = (value as { id?: unknown }).id
  return typeof candidate === "string" && candidate ? candidate : null
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

function normalizeStateFilter(value?: string): AgentStateFilter {
  if (!value) {
    return "ALL"
  }

  const normalized = value.trim().toUpperCase()
  return AGENT_STATE_VALUES.includes(normalized as AgentStateFilter)
    ? (normalized as AgentStateFilter)
    : "ALL"
}

function normalizeRequiredId(value: unknown): string | null {
  if (typeof value !== "string") {
    return null
  }

  const normalized = value.trim()
  return normalized ? normalized : null
}

function normalizeRequiredText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null
  }

  const normalized = value.trim()
  return normalized ? normalized : null
}

function normalizeRequiredEmail(value: unknown): string | null {
  const normalized = normalizeRequiredText(value)
  if (!normalized) {
    return null
  }

  const lowered = normalized.toLowerCase()
  if (!lowered.includes("@")) {
    return null
  }

  return lowered
}

function normalizeOptionalText(value: unknown, maxLength: number): string | null | undefined {
  if (value === undefined) {
    return undefined
  }

  if (value === null) {
    return null
  }

  if (typeof value !== "string") {
    return undefined
  }

  const normalized = value.trim()
  if (!normalized) {
    return null
  }

  if (normalized.length <= maxLength) {
    return normalized
  }

  return normalized.slice(0, maxLength)
}

function normalizeOptionalEmail(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined
  }

  if (typeof value !== "string") {
    return undefined
  }

  const normalized = value.trim().toLowerCase()
  if (!normalized || !normalized.includes("@")) {
    return undefined
  }

  return normalized
}

function normalizeOptionalBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") {
    return value
  }

  if (typeof value !== "string") {
    return undefined
  }

  const normalized = value.trim().toLowerCase()
  if (normalized === "true" || normalized === "1" || normalized === "on") {
    return true
  }

  if (normalized === "false" || normalized === "0" || normalized === "off") {
    return false
  }

  return undefined
}

function normalizeRoleCode(value: unknown): InternalRoleCode | null {
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

function buildPhoneMask(phoneNumber: string | null): string | null {
  if (!phoneNumber) {
    return null
  }

  const digits = phoneNumber.replace(/\D/g, "")
  if (!digits) {
    return "***"
  }

  return `***${digits.slice(-4)}`
}

function buildFailure(
  code: AdminAgentMutationFailureCode,
  message: string,
  fieldErrors?: AgentFieldErrors,
): AdminAgentMutationFailure {
  return {
    ok: false,
    code,
    message,
    fieldErrors,
  }
}

function buildAgentIdentityWhereClause(): SQL<unknown> {
  return or(eq(roles.code, "AGENT"), isNotNull(user.renNumber), isNotNull(user.agencyName))!
}

async function resolveRoleByCode(code: "AGENT" | "CUSTOMER"): Promise<{ id: string; code: string } | null> {
  if (!db) {
    return null
  }

  const rows = await db
    .select({
      id: roles.id,
      code: roles.code,
    })
    .from(roles)
    .where(and(eq(roles.code, code), eq(roles.isActive, true), isNull(roles.deletedAt)))
    .limit(1)

  return rows[0] ?? null
}

async function resolveEmailConflict(email: string, excludeUserId?: string): Promise<boolean> {
  if (!db) {
    return false
  }

  const whereClauses: SQL<unknown>[] = [eq(user.email, email)]
  if (excludeUserId) {
    whereClauses.push(ne(user.id, excludeUserId))
  }

  const rows = await db
    .select({ id: user.id })
    .from(user)
    .where(and(...whereClauses))
    .limit(1)

  return Boolean(rows[0])
}

async function resolvePhoneConflict(phoneNumber: string, excludeUserId?: string): Promise<boolean> {
  if (!db) {
    return false
  }

  const whereClauses: SQL<unknown>[] = [eq(user.phoneNumber, phoneNumber)]
  if (excludeUserId) {
    whereClauses.push(ne(user.id, excludeUserId))
  }

  const rows = await db
    .select({ id: user.id })
    .from(user)
    .where(and(...whereClauses))
    .limit(1)

  return Boolean(rows[0])
}

export async function listAdminAgents(params: ListAdminAgentsParams = {}): Promise<ListAdminAgentsResult> {
  await requireRole(["ADMIN", "SUPER_ADMIN"], {
    nextPath: ROUTES.admin.agents,
  })

  if (!db) {
    return {
      agents: [],
      search: "",
      state: "ALL",
      page: 1,
      pageSize: 20,
      total: 0,
    }
  }

  const search = typeof params.search === "string" ? params.search.trim() : ""
  const state = normalizeStateFilter(params.state)
  const page = normalizePositiveInt(params.page, 1, 500)
  const pageSize = normalizePositiveInt(params.pageSize, 20, 100)

  const whereClauses: SQL<unknown>[] = [buildAgentIdentityWhereClause()]

  if (state === "ACTIVE") {
    whereClauses.push(eq(roles.code, "AGENT"))
  }

  if (state === "INACTIVE") {
    whereClauses.push(or(isNull(roles.code), ne(roles.code, "AGENT"))!)
  }

  if (search) {
    const searchPattern = `%${search}%`
    whereClauses.push(
      or(
        ilike(user.name, searchPattern),
        ilike(user.email, searchPattern),
        ilike(user.phoneNumber, searchPattern),
        ilike(user.renNumber, searchPattern),
        ilike(user.agencyName, searchPattern),
      )!,
    )
  }

  const whereExpression = whereClauses.length === 1 ? whereClauses[0] : and(...whereClauses)

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
      renNumber: user.renNumber,
      agencyName: user.agencyName,
      nationality: user.nationality,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    })
    .from(user)
    .leftJoin(roles, eq(user.roleId, roles.id))
    .where(whereExpression)
    .orderBy(desc(user.updatedAt), desc(user.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize)

  return {
    agents: rows.map((row) => {
      const roleCode = normalizeRoleCode(row.roleCode)
      return {
        id: row.id,
        name: row.name,
        email: row.email,
        phoneMasked: buildPhoneMask(row.phoneNumber),
        roleCode,
        isActive: roleCode === "AGENT",
        renNumber: row.renNumber,
        agencyName: row.agencyName,
        nationality: row.nationality,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      }
    }),
    search,
    state,
    page,
    pageSize,
    total: Number(total ?? 0),
  }
}

export async function getAdminAgentById(agentUserId: string): Promise<GetAdminAgentByIdResult> {
  await requireRole(["ADMIN", "SUPER_ADMIN"], {
    nextPath: ROUTES.admin.agents,
  })

  const normalizedAgentUserId = normalizeRequiredId(agentUserId)
  if (!normalizedAgentUserId) {
    return {
      ok: false,
      code: "VALIDATION_FAILED",
      message: "Agent id is required.",
      fieldErrors: {
        agentUserId: "Agent id is required.",
      },
    }
  }

  if (!db) {
    return {
      ok: false,
      code: "AGENT_NOT_FOUND",
      message: "Agent was not found.",
    }
  }

  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      roleCode: roles.code,
      renNumber: user.renNumber,
      agencyName: user.agencyName,
      nationality: user.nationality,
      onboardingCompleted: user.onboardingCompleted,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    })
    .from(user)
    .leftJoin(roles, eq(user.roleId, roles.id))
    .where(and(eq(user.id, normalizedAgentUserId), buildAgentIdentityWhereClause()))
    .limit(1)

  const row = rows[0]
  if (!row) {
    return {
      ok: false,
      code: "AGENT_NOT_FOUND",
      message: "Agent was not found.",
    }
  }

  const roleCode = normalizeRoleCode(row.roleCode)

  return {
    ok: true,
    agent: {
      id: row.id,
      name: row.name,
      email: row.email,
      phoneNumber: row.phoneNumber,
      roleCode,
      isActive: roleCode === "AGENT",
      renNumber: row.renNumber,
      agencyName: row.agencyName,
      nationality: row.nationality,
      onboardingCompleted: row.onboardingCompleted,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    },
  }
}

export async function createAdminAgent(
  input: AdminAgentMutationInput,
): Promise<AdminAgentMutationResult> {
  const authContext = await requireRole(["ADMIN", "SUPER_ADMIN"], {
    nextPath: ROUTES.admin.agents,
  })

  const actorUserId = resolveActorUserId(authContext.user)
  if (!actorUserId) {
    return buildFailure("UNAUTHENTICATED", "Authentication is required.")
  }

  if (!db) {
    return buildFailure("FORBIDDEN", "Agent service is unavailable.")
  }

  const fieldErrors: AgentFieldErrors = {}

  const name = normalizeRequiredText(input.name)
  if (!name) {
    fieldErrors.name = "Name is required."
  }

  const email = normalizeRequiredEmail(input.email)
  if (!email) {
    fieldErrors.email = "Email is required and must be valid."
  }

  const phoneNumber = normalizeOptionalText(input.phoneNumber, 30)
  const renNumber = normalizeOptionalText(input.renNumber, 50)
  const agencyName = normalizeOptionalText(input.agencyName, 100)
  const nationality = normalizeOptionalText(input.nationality, 100)
  const reasonNote = normalizeOptionalText(input.reasonNote, 500)

  if (phoneNumber === undefined && input.phoneNumber !== undefined) {
    fieldErrors.phoneNumber = "Phone number is invalid."
  }

  if (renNumber === undefined && input.renNumber !== undefined) {
    fieldErrors.renNumber = "REN number is invalid."
  }

  if (agencyName === undefined && input.agencyName !== undefined) {
    fieldErrors.agencyName = "Agency name is invalid."
  }

  if (nationality === undefined && input.nationality !== undefined) {
    fieldErrors.nationality = "Nationality is invalid."
  }

  if (Object.keys(fieldErrors).length > 0) {
    return buildFailure("VALIDATION_FAILED", "Agent payload is invalid.", fieldErrors)
  }

  if (!name || !email) {
    return buildFailure("VALIDATION_FAILED", "Agent payload is invalid.", fieldErrors)
  }

  const agentRole = await resolveRoleByCode("AGENT")
  if (!agentRole) {
    return buildFailure("LOOKUP_NOT_FOUND", "AGENT role was not found.", {
      role: "AGENT role was not found.",
    })
  }

  if (await resolveEmailConflict(email)) {
    return buildFailure("EMAIL_ALREADY_EXISTS", "Email is already used by another user.", {
      email: "Email is already used by another user.",
    })
  }

  if (phoneNumber && (await resolvePhoneConflict(phoneNumber))) {
    return buildFailure("PHONE_ALREADY_EXISTS", "Phone number is already used by another user.", {
      phoneNumber: "Phone number is already used by another user.",
    })
  }

  try {
    return await db.transaction(async (tx) => {
      const insertedRows = await tx
        .insert(user)
        .values({
          id: randomUUID(),
          name,
          email,
          phoneNumber: phoneNumber ?? null,
          roleId: agentRole.id,
          renNumber: renNumber ?? null,
          agencyName: agencyName ?? null,
          nationality: nationality ?? null,
          onboardingCompleted: false,
        })
        .returning({
          id: user.id,
          roleId: user.roleId,
          name: user.name,
          email: user.email,
        })

      const inserted = insertedRows[0]
      if (!inserted) {
        return buildFailure("CREATE_FAILED", "Agent could not be created.")
      }

      await tx.insert(auditLogs).values({
        actorUserId,
        actorRoleId: authContext.roleId,
        actionType: "AGENT_CREATED",
        entityType: "USER",
        entityId: inserted.id,
        beforeJson: null,
        afterJson: {
          name: inserted.name,
          email: inserted.email,
          roleCode: agentRole.code,
        },
        changeSummary: `Agent ${inserted.name} created.`,
        sourceApp: "ADMIN_PORTAL",
        metadata: {
          eventType: "AGENT_CREATED",
          actorUserId,
          targetUserId: inserted.id,
          reasonNote,
        },
      })

      return {
        ok: true,
        agentUserId: inserted.id,
      }
    })
  } catch {
    return buildFailure("CREATE_FAILED", "Agent could not be created.")
  }
}

export async function updateAdminAgent(
  input: AdminAgentMutationInput,
): Promise<AdminAgentMutationResult> {
  const authContext = await requireRole(["ADMIN", "SUPER_ADMIN"], {
    nextPath: ROUTES.admin.agents,
  })

  const actorUserId = resolveActorUserId(authContext.user)
  if (!actorUserId) {
    return buildFailure("UNAUTHENTICATED", "Authentication is required.")
  }

  if (!db) {
    return buildFailure("FORBIDDEN", "Agent service is unavailable.")
  }

  const agentUserId = normalizeRequiredId(input.agentUserId)
  if (!agentUserId) {
    return buildFailure("VALIDATION_FAILED", "Agent id is required.", {
      agentUserId: "Agent id is required.",
    })
  }

  const currentRows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      roleCode: roles.code,
      renNumber: user.renNumber,
      agencyName: user.agencyName,
      nationality: user.nationality,
    })
    .from(user)
    .leftJoin(roles, eq(user.roleId, roles.id))
    .where(and(eq(user.id, agentUserId), buildAgentIdentityWhereClause()))
    .limit(1)

  const current = currentRows[0]
  if (!current) {
    return buildFailure("AGENT_NOT_FOUND", "Agent was not found.")
  }

  const fieldErrors: AgentFieldErrors = {}

  const name = normalizeOptionalText(input.name, 200)
  const email = normalizeOptionalEmail(input.email)
  const phoneNumber = normalizeOptionalText(input.phoneNumber, 30)
  const renNumber = normalizeOptionalText(input.renNumber, 50)
  const agencyName = normalizeOptionalText(input.agencyName, 100)
  const nationality = normalizeOptionalText(input.nationality, 100)
  const reasonNote = normalizeOptionalText(input.reasonNote, 500)

  if (name === undefined && input.name !== undefined) {
    fieldErrors.name = "Name is invalid."
  }

  if (email === undefined && input.email !== undefined) {
    fieldErrors.email = "Email is invalid."
  }

  if (phoneNumber === undefined && input.phoneNumber !== undefined) {
    fieldErrors.phoneNumber = "Phone number is invalid."
  }

  if (renNumber === undefined && input.renNumber !== undefined) {
    fieldErrors.renNumber = "REN number is invalid."
  }

  if (agencyName === undefined && input.agencyName !== undefined) {
    fieldErrors.agencyName = "Agency name is invalid."
  }

  if (nationality === undefined && input.nationality !== undefined) {
    fieldErrors.nationality = "Nationality is invalid."
  }

  if (Object.keys(fieldErrors).length > 0) {
    return buildFailure("VALIDATION_FAILED", "Agent payload is invalid.", fieldErrors)
  }

  if (email && (await resolveEmailConflict(email, agentUserId))) {
    return buildFailure("EMAIL_ALREADY_EXISTS", "Email is already used by another user.", {
      email: "Email is already used by another user.",
    })
  }

  if (phoneNumber && (await resolvePhoneConflict(phoneNumber, agentUserId))) {
    return buildFailure("PHONE_ALREADY_EXISTS", "Phone number is already used by another user.", {
      phoneNumber: "Phone number is already used by another user.",
    })
  }

  const updatePayload: Partial<typeof user.$inferInsert> = {}

  if (name !== undefined) {
    updatePayload.name = name ?? current.name
  }

  if (email !== undefined) {
    updatePayload.email = email
  }

  if (phoneNumber !== undefined) {
    updatePayload.phoneNumber = phoneNumber
  }

  if (renNumber !== undefined) {
    updatePayload.renNumber = renNumber
  }

  if (agencyName !== undefined) {
    updatePayload.agencyName = agencyName
  }

  if (nationality !== undefined) {
    updatePayload.nationality = nationality
  }

  if (Object.keys(updatePayload).length === 0) {
    return buildFailure("VALIDATION_FAILED", "Provide at least one field to update.", {
      form: "Provide at least one field to update.",
    })
  }

  try {
    return await db.transaction(async (tx) => {
      const updatedRows = await tx
        .update(user)
        .set(updatePayload)
        .where(eq(user.id, agentUserId))
        .returning({
          id: user.id,
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber,
          renNumber: user.renNumber,
          agencyName: user.agencyName,
          nationality: user.nationality,
        })

      const updated = updatedRows[0]
      if (!updated) {
        return buildFailure("UPDATE_FAILED", "Agent could not be updated.")
      }

      await tx.insert(auditLogs).values({
        actorUserId,
        actorRoleId: authContext.roleId,
        actionType: "AGENT_UPDATED",
        entityType: "USER",
        entityId: updated.id,
        beforeJson: {
          name: current.name,
          email: current.email,
          phoneNumber: current.phoneNumber,
          renNumber: current.renNumber,
          agencyName: current.agencyName,
          nationality: current.nationality,
        },
        afterJson: {
          name: updated.name,
          email: updated.email,
          phoneNumber: updated.phoneNumber,
          renNumber: updated.renNumber,
          agencyName: updated.agencyName,
          nationality: updated.nationality,
        },
        changeSummary: `Agent ${updated.name} updated.`,
        sourceApp: "ADMIN_PORTAL",
        metadata: {
          eventType: "AGENT_UPDATED",
          actorUserId,
          targetUserId: updated.id,
          reasonNote,
        },
      })

      return {
        ok: true,
        agentUserId: updated.id,
      }
    })
  } catch {
    return buildFailure("UPDATE_FAILED", "Agent could not be updated.")
  }
}

export async function setAdminAgentActiveState(
  input: SetAdminAgentActiveStateInput,
): Promise<AdminAgentMutationResult> {
  const authContext = await requireRole(["ADMIN", "SUPER_ADMIN"], {
    nextPath: ROUTES.admin.agents,
  })

  const actorUserId = resolveActorUserId(authContext.user)
  if (!actorUserId) {
    return buildFailure("UNAUTHENTICATED", "Authentication is required.")
  }

  if (!db) {
    return buildFailure("FORBIDDEN", "Agent service is unavailable.")
  }

  const agentUserId = normalizeRequiredId(input.agentUserId)
  if (!agentUserId) {
    return buildFailure("VALIDATION_FAILED", "Agent id is required.", {
      agentUserId: "Agent id is required.",
    })
  }

  const isActive = normalizeOptionalBoolean(input.isActive)
  if (isActive === undefined) {
    return buildFailure("VALIDATION_FAILED", "Active state is invalid.", {
      isActive: "Active state is invalid.",
    })
  }

  const reasonNote = normalizeOptionalText(input.reasonNote, 500)

  const currentRows = await db
    .select({
      id: user.id,
      roleId: user.roleId,
      roleCode: roles.code,
      renNumber: user.renNumber,
      agencyName: user.agencyName,
    })
    .from(user)
    .leftJoin(roles, eq(user.roleId, roles.id))
    .where(eq(user.id, agentUserId))
    .limit(1)

  const current = currentRows[0]
  if (!current || (!current.renNumber && !current.agencyName && current.roleCode !== "AGENT")) {
    return buildFailure("AGENT_NOT_FOUND", "Agent was not found.")
  }

  const [agentRole, customerRole] = await Promise.all([
    resolveRoleByCode("AGENT"),
    resolveRoleByCode("CUSTOMER"),
  ])

  if (!agentRole || !customerRole) {
    return buildFailure("LOOKUP_NOT_FOUND", "Required role lookup is missing.", {
      role: "Required role lookup is missing.",
    })
  }

  const targetRole = isActive ? agentRole : customerRole
  if (current.roleId === targetRole.id) {
    return {
      ok: true,
      agentUserId,
    }
  }

  try {
    return await db.transaction(async (tx) => {
      const updatedRows = await tx
        .update(user)
        .set({
          roleId: targetRole.id,
        })
        .where(eq(user.id, agentUserId))
        .returning({
          id: user.id,
          roleId: user.roleId,
        })

      const updated = updatedRows[0]
      if (!updated) {
        return buildFailure("ACTIVE_STATE_UPDATE_FAILED", "Agent active state could not be updated.")
      }

      await tx.insert(auditLogs).values({
        actorUserId,
        actorRoleId: authContext.roleId,
        actionType: "AGENT_ACTIVE_STATE_UPDATED",
        entityType: "USER",
        entityId: updated.id,
        beforeJson: {
          roleCode: current.roleCode,
          isActive: current.roleCode === "AGENT",
        },
        afterJson: {
          roleCode: targetRole.code,
          isActive,
        },
        changeSummary: `Agent state changed to ${isActive ? "ACTIVE" : "INACTIVE"}.`,
        sourceApp: "ADMIN_PORTAL",
        metadata: {
          eventType: "AGENT_ACTIVE_STATE_UPDATED",
          actorUserId,
          targetUserId: updated.id,
          isActive,
          reasonNote,
        },
      })

      return {
        ok: true,
        agentUserId: updated.id,
      }
    })
  } catch {
    return buildFailure("ACTIVE_STATE_UPDATE_FAILED", "Agent active state could not be updated.")
  }
}
