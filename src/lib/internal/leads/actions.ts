import "server-only"

import { and, desc, eq, isNull, type SQL } from "drizzle-orm"

import { auditLogs } from "@/db/schema/audit"
import { db } from "@/db"
import { leadActivities, leadSources, leads, leadStatusHistory } from "@/db/schema/crm-leads"
import { user } from "@/db/schema/identity-auth"
import { requireRole } from "@/lib/auth/guards"

export const LEAD_STATUS_VALUES = [
  "NEW",
  "UNCONTACTED",
  "ASSIGNED",
  "CONTACTED",
  "QUALIFIED",
  "NURTURING",
  "APPOINTMENT_SET",
  "LOST",
  "SPAM",
  "CLOSED",
] as const

export type LeadStatusValue = (typeof LEAD_STATUS_VALUES)[number]

const LEAD_STATUS_SET = new Set<LeadStatusValue>(LEAD_STATUS_VALUES)

const LEAD_STATUS_TRANSITIONS: Record<LeadStatusValue, readonly LeadStatusValue[]> = {
  NEW: ["UNCONTACTED", "ASSIGNED", "CONTACTED", "LOST", "SPAM"],
  UNCONTACTED: ["ASSIGNED", "CONTACTED", "LOST", "SPAM"],
  ASSIGNED: ["CONTACTED", "QUALIFIED", "NURTURING", "LOST", "SPAM"],
  CONTACTED: ["QUALIFIED", "NURTURING", "LOST", "SPAM"],
  QUALIFIED: ["APPOINTMENT_SET", "NURTURING", "LOST"],
  NURTURING: ["QUALIFIED", "APPOINTMENT_SET", "LOST", "CLOSED"],
  APPOINTMENT_SET: ["CLOSED", "NURTURING", "LOST"],
  LOST: ["NURTURING", "CLOSED"],
  SPAM: ["CLOSED"],
  CLOSED: [],
}

const AGENT_TARGET_LEAD_STATUSES = new Set<LeadStatusValue>([
  "CONTACTED",
  "QUALIFIED",
  "NURTURING",
  "APPOINTMENT_SET",
  "LOST",
])

export type WorkspaceLeadItem = {
  id: string
  fullName: string
  phone: string
  status: string
  sourceName: string | null
  assigneeName: string | null
  updatedAt: string
  lastActivityAt: string | null
}

type ListWorkspaceLeadsOptions = {
  nextPath?: string
  limit?: number
}

export type UpdateWorkspaceLeadStatusInput = {
  leadId: string
  toStatus: LeadStatusValue
  reasonCode?: string
  reasonNote?: string
  nextPath?: string
}

export type UpdateWorkspaceLeadStatusFailureCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "VALIDATION_FAILED"
  | "LEAD_NOT_FOUND"
  | "INVALID_STATUS_TRANSITION"
  | "UPDATE_FAILED"

export type UpdateWorkspaceLeadStatusSuccess = {
  ok: true
  leadId: string
  fromStatus: LeadStatusValue
  toStatus: LeadStatusValue
}

export type UpdateWorkspaceLeadStatusFailure = {
  ok: false
  code: UpdateWorkspaceLeadStatusFailureCode
  message: string
}

export type UpdateWorkspaceLeadStatusResult =
  | UpdateWorkspaceLeadStatusSuccess
  | UpdateWorkspaceLeadStatusFailure

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

function normalizeLeadId(value: unknown): string | null {
  if (typeof value !== "string") {
    return null
  }

  const normalized = value.trim()
  return normalized ? normalized : null
}

function normalizeOptionalText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") {
    return null
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

function normalizeLeadStatus(value: unknown): LeadStatusValue | null {
  if (typeof value !== "string") {
    return null
  }

  const normalized = value.trim().toUpperCase() as LeadStatusValue
  return LEAD_STATUS_SET.has(normalized) ? normalized : null
}

function resolveRoleAllowedLeadTargetStatusSet(
  roleCode: "ADMIN" | "SUPER_ADMIN" | "AGENT",
): ReadonlySet<LeadStatusValue> {
  if (roleCode === "AGENT") {
    return AGENT_TARGET_LEAD_STATUSES
  }

  return LEAD_STATUS_SET
}

function buildUpdateFailure(
  code: UpdateWorkspaceLeadStatusFailureCode,
  message: string,
): UpdateWorkspaceLeadStatusFailure {
  return {
    ok: false,
    code,
    message,
  }
}

export function canTransitionLeadStatus(
  fromStatus: LeadStatusValue,
  toStatus: LeadStatusValue,
): boolean {
  if (fromStatus === toStatus) {
    return false
  }

  return LEAD_STATUS_TRANSITIONS[fromStatus].includes(toStatus)
}

export function getNextLeadStatuses(status: LeadStatusValue): readonly LeadStatusValue[] {
  return LEAD_STATUS_TRANSITIONS[status]
}

export function getRoleAllowedLeadTargetStatuses(
  roleCode: "ADMIN" | "SUPER_ADMIN" | "AGENT",
): readonly LeadStatusValue[] {
  const allowedStatuses = resolveRoleAllowedLeadTargetStatusSet(roleCode)
  return LEAD_STATUS_VALUES.filter((status) => allowedStatuses.has(status))
}

export function isLeadStatusAllowedForRole(
  roleCode: "ADMIN" | "SUPER_ADMIN" | "AGENT",
  toStatus: LeadStatusValue,
): boolean {
  return resolveRoleAllowedLeadTargetStatusSet(roleCode).has(toStatus)
}

export function resolveNextLeadStatus(status: LeadStatusValue): LeadStatusValue | null {
  const candidates = LEAD_STATUS_TRANSITIONS[status]
  return candidates[0] ?? null
}

export function resolveRoleNextLeadStatus(
  roleCode: "ADMIN" | "SUPER_ADMIN" | "AGENT",
  status: LeadStatusValue,
): LeadStatusValue | null {
  const allowedTargets = resolveRoleAllowedLeadTargetStatusSet(roleCode)
  return LEAD_STATUS_TRANSITIONS[status].find((candidate) => allowedTargets.has(candidate)) ?? null
}

export async function listWorkspaceLeads(
  options: ListWorkspaceLeadsOptions = {},
): Promise<WorkspaceLeadItem[]> {
  const authContext = await requireRole(["ADMIN", "SUPER_ADMIN", "AGENT"], {
    nextPath: options.nextPath,
  })

  if (!db) {
    return []
  }

  const actorUserId = resolveActorUserId(authContext.user)
  const limit = normalizePositiveInt(options.limit, 25, 100)

  const whereClauses: SQL<unknown>[] = [isNull(leads.deletedAt)]

  if (authContext.roleCode === "AGENT") {
    if (!actorUserId) {
      return []
    }

    whereClauses.push(eq(leads.currentAssigneeUserId, actorUserId))
  }

  const whereExpression =
    whereClauses.length === 1
      ? whereClauses[0]
      : and(...whereClauses)

  const rows = await db
    .select({
      id: leads.id,
      fullName: leads.fullName,
      phone: leads.primaryPhoneE164,
      status: leads.currentStatus,
      sourceName: leadSources.name,
      assigneeName: user.name,
      updatedAt: leads.updatedAt,
      lastActivityAt: leads.lastActivityAt,
    })
    .from(leads)
    .leftJoin(leadSources, eq(leads.sourceId, leadSources.id))
    .leftJoin(user, eq(leads.currentAssigneeUserId, user.id))
    .where(whereExpression)
    .orderBy(desc(leads.updatedAt))
    .limit(limit)

  return rows.map((row) => ({
    id: row.id,
    fullName: row.fullName ?? "Unknown",
    phone: row.phone,
    status: row.status,
    sourceName: row.sourceName,
    assigneeName: row.assigneeName,
    updatedAt: row.updatedAt.toISOString(),
    lastActivityAt: row.lastActivityAt ? row.lastActivityAt.toISOString() : null,
  }))
}

export async function updateWorkspaceLeadStatus(
  input: UpdateWorkspaceLeadStatusInput,
): Promise<UpdateWorkspaceLeadStatusResult> {
  const authContext = await requireRole(["ADMIN", "SUPER_ADMIN", "AGENT"], {
    nextPath: input.nextPath,
  })

  if (!db) {
    return buildUpdateFailure("UPDATE_FAILED", "Lead update service is unavailable.")
  }

  const actorUserId = resolveActorUserId(authContext.user)
  if (!actorUserId) {
    return buildUpdateFailure("UNAUTHENTICATED", "Authentication is required.")
  }

  const roleCode = authContext.roleCode
  if (roleCode !== "ADMIN" && roleCode !== "SUPER_ADMIN" && roleCode !== "AGENT") {
    return buildUpdateFailure("FORBIDDEN", "Only internal users can update lead status.")
  }

  const leadId = normalizeLeadId(input.leadId)
  if (!leadId) {
    return buildUpdateFailure("VALIDATION_FAILED", "Lead id is required.")
  }

  const toStatus = normalizeLeadStatus(input.toStatus)
  if (!toStatus) {
    return buildUpdateFailure("VALIDATION_FAILED", "Target lead status is invalid.")
  }

  const reasonCode = normalizeOptionalText(input.reasonCode, 50)
  const reasonNote = normalizeOptionalText(input.reasonNote, 500)

  if ((toStatus === "LOST" || toStatus === "SPAM") && !reasonNote) {
    return buildUpdateFailure("VALIDATION_FAILED", "A reason note is required for LOST or SPAM status.")
  }

  try {
    return await db.transaction(async (tx) => {
      const leadRows = await tx
        .select({
          id: leads.id,
          currentStatus: leads.currentStatus,
          currentAssigneeUserId: leads.currentAssigneeUserId,
        })
        .from(leads)
        .where(and(eq(leads.id, leadId), isNull(leads.deletedAt)))
        .limit(1)

      const leadRow = leadRows[0]
      if (!leadRow) {
        return buildUpdateFailure("LEAD_NOT_FOUND", "Lead was not found.")
      }

      const fromStatus = normalizeLeadStatus(leadRow.currentStatus)
      if (!fromStatus) {
        return buildUpdateFailure("UPDATE_FAILED", "Lead status is invalid in database.")
      }

      const allowedTargets = resolveRoleAllowedLeadTargetStatusSet(roleCode)
      if (!allowedTargets.has(toStatus)) {
        return buildUpdateFailure("FORBIDDEN", "Your role cannot set this lead status.")
      }

      if (roleCode === "AGENT" && leadRow.currentAssigneeUserId !== actorUserId) {
        return buildUpdateFailure("FORBIDDEN", "Agents can only update statuses for assigned leads.")
      }

      if (!canTransitionLeadStatus(fromStatus, toStatus)) {
        return buildUpdateFailure("INVALID_STATUS_TRANSITION", "Lead status transition is not allowed.")
      }

      const updatedRows = await tx
        .update(leads)
        .set({
          currentStatus: toStatus,
          lastActivityAt: new Date(),
        })
        .where(eq(leads.id, leadId))
        .returning({
          id: leads.id,
          currentStatus: leads.currentStatus,
        })

      const updated = updatedRows[0]
      if (!updated) {
        return buildUpdateFailure("UPDATE_FAILED", "Lead status could not be updated.")
      }

      await tx.insert(leadStatusHistory).values({
        leadId,
        fromStatus,
        toStatus,
        changedByUserId: actorUserId,
        reasonCode,
        reasonNote,
        sourceEventType: "INTERNAL_WORKFLOW",
      })

      await tx.insert(leadActivities).values({
        leadId,
        actorUserId,
        activityType: "STATUS_CHANGED",
        title: `Lead status updated to ${toStatus}`,
        body: reasonNote,
      })

      await tx.insert(auditLogs).values({
        actorUserId,
        actorRoleId: authContext.roleId,
        actionType: "LEAD_STATUS_UPDATED",
        entityType: "LEAD",
        entityId: leadId,
        beforeJson: {
          status: fromStatus,
          assigneeUserId: leadRow.currentAssigneeUserId,
        },
        afterJson: {
          status: toStatus,
          assigneeUserId: leadRow.currentAssigneeUserId,
        },
        changeSummary: `Lead status moved from ${fromStatus} to ${toStatus}.`,
        sourceApp: "INTERNAL_WORKSPACE",
        metadata: {
          eventType: "LEAD_STATUS_UPDATED",
          leadId,
          fromStatus,
          toStatus,
          reasonCode,
          reasonNote,
        },
      })

      return {
        ok: true,
        leadId,
        fromStatus,
        toStatus,
      }
    })
  } catch {
    return buildUpdateFailure("UPDATE_FAILED", "Lead status could not be updated.")
  }
}
