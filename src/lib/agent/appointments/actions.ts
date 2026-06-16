import "server-only"

import { and, desc, eq, ilike, inArray, isNull, or, sql, type SQL } from "drizzle-orm"

import { ROUTES } from "@/config/routes"
import { db } from "@/db"
import { leadActivities, leads } from "@/db/schema/crm-leads"
import { requireRole } from "@/lib/auth/guards"
import {
  LEAD_STATUS_VALUES,
  updateWorkspaceLeadStatus,
  type LeadStatusValue,
  type UpdateWorkspaceLeadStatusResult,
} from "@/lib/internal/leads/actions"

const LEAD_STATUS_SET = new Set<LeadStatusValue>(LEAD_STATUS_VALUES)

const APPOINTMENT_PIPELINE_STATUSES: readonly LeadStatusValue[] = ["QUALIFIED", "NURTURING"]
const APPOINTMENT_SCHEDULED_STATUSES: readonly LeadStatusValue[] = ["APPOINTMENT_SET"]
const APPOINTMENT_ALL_STATUSES: readonly LeadStatusValue[] = [
  ...APPOINTMENT_PIPELINE_STATUSES,
  ...APPOINTMENT_SCHEDULED_STATUSES,
]

const APPOINTMENT_TARGET_STATUS_SET = new Set<LeadStatusValue>(["APPOINTMENT_SET", "NURTURING", "LOST"])

export type AgentAppointmentScope = "ALL" | "SCHEDULED" | "PIPELINE"

export type AgentAppointmentListItem = {
  leadId: string
  leadName: string
  phone: string
  status: string
  sourceName: string | null
  lastActivityAt: string | null
  updatedAt: string
}

export type ListAgentAppointmentsParams = {
  search?: string
  scope?: AgentAppointmentScope
  page?: number
  pageSize?: number
  nextPath?: string
}

export type ListAgentAppointmentsResult = {
  appointments: AgentAppointmentListItem[]
  search: string
  scope: AgentAppointmentScope
  page: number
  pageSize: number
  total: number
  scheduledCount: number
  pipelineCount: number
}

export type SetAgentAppointmentStatusInput = {
  leadId: string
  toStatus: LeadStatusValue
  reasonCode?: string
  reasonNote?: string
  nextPath?: string
}

export type RescheduleAgentAppointmentInput = {
  leadId: string
  scheduledAt?: string
  note?: string
  nextPath?: string
}

export type RescheduleAgentAppointmentFailureCode =
  | "UNAUTHENTICATED"
  | "VALIDATION_FAILED"
  | "LEAD_NOT_FOUND"
  | "UPDATE_FAILED"

export type RescheduleAgentAppointmentSuccess = {
  ok: true
  leadId: string
  scheduledAt: string | null
}

export type RescheduleAgentAppointmentFailure = {
  ok: false
  code: RescheduleAgentAppointmentFailureCode
  message: string
}

export type RescheduleAgentAppointmentResult =
  | RescheduleAgentAppointmentSuccess
  | RescheduleAgentAppointmentFailure

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

function normalizeSearch(value: unknown): string {
  if (typeof value !== "string") {
    return ""
  }

  return value.trim()
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

  return normalized.length <= maxLength ? normalized : normalized.slice(0, maxLength)
}

function normalizeScope(value: unknown): AgentAppointmentScope {
  if (typeof value !== "string") {
    return "ALL"
  }

  const normalized = value.trim().toUpperCase()
  if (normalized === "SCHEDULED") {
    return "SCHEDULED"
  }

  if (normalized === "PIPELINE") {
    return "PIPELINE"
  }

  return "ALL"
}

function normalizeLeadStatus(value: unknown): LeadStatusValue | null {
  if (typeof value !== "string") {
    return null
  }

  const normalized = value.trim().toUpperCase() as LeadStatusValue
  return LEAD_STATUS_SET.has(normalized) ? normalized : null
}

function parseOptionalDateTime(value: unknown): { value: Date | null; invalid: boolean } {
  if (typeof value !== "string") {
    return { value: null, invalid: false }
  }

  const normalized = value.trim()
  if (!normalized) {
    return { value: null, invalid: false }
  }

  const parsed = new Date(normalized)
  if (Number.isNaN(parsed.getTime())) {
    return { value: null, invalid: true }
  }

  return { value: parsed, invalid: false }
}

function buildWhereExpression(clauses: SQL<unknown>[]): SQL<unknown> | undefined {
  if (clauses.length === 0) {
    return undefined
  }

  if (clauses.length === 1) {
    return clauses[0]
  }

  return and(...clauses)
}

function getScopeStatuses(scope: AgentAppointmentScope): readonly LeadStatusValue[] {
  if (scope === "SCHEDULED") {
    return APPOINTMENT_SCHEDULED_STATUSES
  }

  if (scope === "PIPELINE") {
    return APPOINTMENT_PIPELINE_STATUSES
  }

  return APPOINTMENT_ALL_STATUSES
}

function buildRescheduleBody(scheduleAt: Date | null, note: string | null): string {
  const parts: string[] = []

  if (scheduleAt) {
    parts.push(`Scheduled for ${scheduleAt.toISOString()}`)
  }

  if (note) {
    parts.push(note)
  }

  return parts.join(" | ")
}

function buildRescheduleFailure(
  code: RescheduleAgentAppointmentFailureCode,
  message: string,
): RescheduleAgentAppointmentFailure {
  return {
    ok: false,
    code,
    message,
  }
}

export async function listAgentAppointments(
  params: ListAgentAppointmentsParams = {},
): Promise<ListAgentAppointmentsResult> {
  const authContext = await requireRole(["AGENT"], {
    nextPath: params.nextPath ?? ROUTES.agent.appointments,
  })

  const search = normalizeSearch(params.search)
  const scope = normalizeScope(params.scope)
  const page = normalizePositiveInt(params.page, 1, 500)
  const pageSize = normalizePositiveInt(params.pageSize, 20, 100)

  if (!db) {
    return {
      appointments: [],
      search,
      scope,
      page,
      pageSize,
      total: 0,
      scheduledCount: 0,
      pipelineCount: 0,
    }
  }

  const actorUserId = resolveActorUserId(authContext.user)
  if (!actorUserId) {
    return {
      appointments: [],
      search,
      scope,
      page,
      pageSize,
      total: 0,
      scheduledCount: 0,
      pipelineCount: 0,
    }
  }

  const statusRows = await db
    .select({
      status: leads.currentStatus,
      total: sql<number>`count(*)`,
    })
    .from(leads)
    .where(
      and(
        isNull(leads.deletedAt),
        eq(leads.currentAssigneeUserId, actorUserId),
        inArray(leads.currentStatus, APPOINTMENT_ALL_STATUSES),
      ),
    )
    .groupBy(leads.currentStatus)

  let scheduledCount = 0
  let pipelineCount = 0

  for (const row of statusRows) {
    const count = Number(row.total ?? 0)
    if (row.status === "APPOINTMENT_SET") {
      scheduledCount += count
      continue
    }

    if (row.status === "QUALIFIED" || row.status === "NURTURING") {
      pipelineCount += count
    }
  }

  const whereClauses: SQL<unknown>[] = [
    isNull(leads.deletedAt),
    eq(leads.currentAssigneeUserId, actorUserId),
    inArray(leads.currentStatus, getScopeStatuses(scope)),
  ]

  if (search) {
    const searchPattern = `%${search}%`
    whereClauses.push(
      or(
        ilike(leads.fullName, searchPattern),
        ilike(leads.primaryPhoneE164, searchPattern),
      )!,
    )
  }

  const whereExpression = buildWhereExpression(whereClauses)

  const [{ total }] = await db
    .select({
      total: sql<number>`count(*)`,
    })
    .from(leads)
    .where(whereExpression)

  const rows = await db
    .select({
      leadId: leads.id,
      leadName: leads.fullName,
      phone: leads.primaryPhoneE164,
      status: leads.currentStatus,
      sourceName: leads.sourceId,
      lastActivityAt: leads.lastActivityAt,
      updatedAt: leads.updatedAt,
    })
    .from(leads)
    .where(whereExpression)
    .orderBy(desc(leads.updatedAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize)

  return {
    appointments: rows.map((row) => ({
      leadId: row.leadId,
      leadName: row.leadName ?? "Unknown",
      phone: row.phone,
      status: row.status,
      sourceName: row.sourceName,
      lastActivityAt: row.lastActivityAt ? row.lastActivityAt.toISOString() : null,
      updatedAt: row.updatedAt.toISOString(),
    })),
    search,
    scope,
    page,
    pageSize,
    total: Number(total ?? 0),
    scheduledCount,
    pipelineCount,
  }
}

export async function setAgentAppointmentStatus(
  input: SetAgentAppointmentStatusInput,
): Promise<UpdateWorkspaceLeadStatusResult> {
  const leadId = normalizeLeadId(input.leadId)
  if (!leadId) {
    return {
      ok: false,
      code: "VALIDATION_FAILED",
      message: "Lead id is required.",
    }
  }

  const toStatus = normalizeLeadStatus(input.toStatus)
  if (!toStatus) {
    return {
      ok: false,
      code: "VALIDATION_FAILED",
      message: "Target status is invalid.",
    }
  }

  if (!APPOINTMENT_TARGET_STATUS_SET.has(toStatus)) {
    return {
      ok: false,
      code: "VALIDATION_FAILED",
      message: "Appointment workflow only supports appointment-related status targets.",
    }
  }

  return updateWorkspaceLeadStatus({
    leadId,
    toStatus,
    reasonCode: normalizeOptionalText(input.reasonCode, 50) ?? undefined,
    reasonNote: normalizeOptionalText(input.reasonNote, 500) ?? undefined,
    nextPath: input.nextPath ?? ROUTES.agent.appointments,
  })
}

export async function rescheduleAgentAppointment(
  input: RescheduleAgentAppointmentInput,
): Promise<RescheduleAgentAppointmentResult> {
  const authContext = await requireRole(["AGENT"], {
    nextPath: input.nextPath ?? ROUTES.agent.appointments,
  })

  if (!db) {
    return buildRescheduleFailure("UPDATE_FAILED", "Appointment reschedule service is unavailable.")
  }

  const actorUserId = resolveActorUserId(authContext.user)
  if (!actorUserId) {
    return buildRescheduleFailure("UNAUTHENTICATED", "Authentication is required.")
  }

  const leadId = normalizeLeadId(input.leadId)
  if (!leadId) {
    return buildRescheduleFailure("VALIDATION_FAILED", "Lead id is required.")
  }

  const parsedSchedule = parseOptionalDateTime(input.scheduledAt)
  if (parsedSchedule.invalid) {
    return buildRescheduleFailure("VALIDATION_FAILED", "Scheduled datetime is invalid.")
  }

  const note = normalizeOptionalText(input.note, 500)
  if (!parsedSchedule.value && !note) {
    return buildRescheduleFailure(
      "VALIDATION_FAILED",
      "Provide a new schedule datetime or a note for the appointment reschedule entry.",
    )
  }

  try {
    return await db.transaction(async (tx) => {
      const leadRows = await tx
        .select({ id: leads.id })
        .from(leads)
        .where(and(eq(leads.id, leadId), eq(leads.currentAssigneeUserId, actorUserId), isNull(leads.deletedAt)))
        .limit(1)

      if (!leadRows[0]) {
        return buildRescheduleFailure(
          "LEAD_NOT_FOUND",
          "Lead was not found or is not assigned to the current agent.",
        )
      }

      await tx.insert(leadActivities).values({
        leadId,
        actorUserId,
        activityType: "APPOINTMENT_RESCHEDULED",
        title: "Appointment rescheduled",
        body: buildRescheduleBody(parsedSchedule.value, note),
        dueAt: parsedSchedule.value,
        metadata: {
          scheduledAt: parsedSchedule.value ? parsedSchedule.value.toISOString() : null,
        },
      })

      await tx
        .update(leads)
        .set({
          lastActivityAt: new Date(),
        })
        .where(eq(leads.id, leadId))

      return {
        ok: true,
        leadId,
        scheduledAt: parsedSchedule.value ? parsedSchedule.value.toISOString() : null,
      } satisfies RescheduleAgentAppointmentSuccess
    })
  } catch {
    return buildRescheduleFailure("UPDATE_FAILED", "Unable to save appointment reschedule entry.")
  }
}