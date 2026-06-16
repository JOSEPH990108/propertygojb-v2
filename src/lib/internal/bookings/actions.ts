import "server-only"

import { and, desc, eq, isNull, type SQL } from "drizzle-orm"

import { db } from "@/db"
import { auditLogs } from "@/db/schema/audit"
import { bookingActivities, bookings, bookingStatusHistory } from "@/db/schema/bookings"
import { projects } from "@/db/schema/catalog"
import { leads } from "@/db/schema/crm-leads"
import { user } from "@/db/schema/identity-auth"
import { requireRole } from "@/lib/auth/guards"

export const BOOKING_STATUS_VALUES = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "PAYMENT_PENDING",
  "PAYMENT_VERIFIED",
  "DOCS_PENDING",
  "DOCS_VERIFIED",
  "APPROVED",
  "REJECTED",
  "EXPIRED",
  "CANCELLED",
] as const

export type BookingStatusValue = (typeof BOOKING_STATUS_VALUES)[number]

const BOOKING_STATUS_SET = new Set<BookingStatusValue>(BOOKING_STATUS_VALUES)

const BOOKING_STATUS_TRANSITIONS: Record<BookingStatusValue, readonly BookingStatusValue[]> = {
  DRAFT: ["SUBMITTED", "CANCELLED"],
  SUBMITTED: ["UNDER_REVIEW", "CANCELLED"],
  UNDER_REVIEW: ["PAYMENT_PENDING", "DOCS_PENDING", "REJECTED", "CANCELLED"],
  PAYMENT_PENDING: ["PAYMENT_VERIFIED", "REJECTED", "EXPIRED", "CANCELLED"],
  PAYMENT_VERIFIED: ["DOCS_PENDING", "APPROVED", "REJECTED", "CANCELLED"],
  DOCS_PENDING: ["DOCS_VERIFIED", "PAYMENT_PENDING", "REJECTED", "CANCELLED"],
  DOCS_VERIFIED: ["APPROVED", "REJECTED", "CANCELLED"],
  APPROVED: ["CANCELLED"],
  REJECTED: ["UNDER_REVIEW", "CANCELLED"],
  EXPIRED: ["UNDER_REVIEW", "CANCELLED"],
  CANCELLED: [],
}

const AGENT_TARGET_BOOKING_STATUSES = new Set<BookingStatusValue>([
  "SUBMITTED",
  "UNDER_REVIEW",
  "PAYMENT_PENDING",
  "DOCS_PENDING",
  "CANCELLED",
])

export type WorkspaceBookingItem = {
  id: string
  bookingCode: string
  status: string
  projectName: string
  leadName: string
  assignedAgentName: string | null
  bookingFeeAmount: string | null
  updatedAt: string
}

type ListWorkspaceBookingsOptions = {
  nextPath?: string
  limit?: number
}

export type UpdateWorkspaceBookingStatusInput = {
  bookingId: string
  toStatus: BookingStatusValue
  reasonCode?: string
  reasonNote?: string
  nextPath?: string
}

export type UpdateWorkspaceBookingStatusFailureCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "VALIDATION_FAILED"
  | "BOOKING_NOT_FOUND"
  | "INVALID_STATUS_TRANSITION"
  | "UPDATE_FAILED"

export type UpdateWorkspaceBookingStatusSuccess = {
  ok: true
  bookingId: string
  fromStatus: BookingStatusValue
  toStatus: BookingStatusValue
}

export type UpdateWorkspaceBookingStatusFailure = {
  ok: false
  code: UpdateWorkspaceBookingStatusFailureCode
  message: string
}

export type UpdateWorkspaceBookingStatusResult =
  | UpdateWorkspaceBookingStatusSuccess
  | UpdateWorkspaceBookingStatusFailure

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

function normalizeBookingId(value: unknown): string | null {
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

function normalizeBookingStatus(value: unknown): BookingStatusValue | null {
  if (typeof value !== "string") {
    return null
  }

  const normalized = value.trim().toUpperCase() as BookingStatusValue
  return BOOKING_STATUS_SET.has(normalized) ? normalized : null
}

function resolveRoleAllowedTargetStatuses(roleCode: "ADMIN" | "SUPER_ADMIN" | "AGENT"): ReadonlySet<BookingStatusValue> {
  if (roleCode === "AGENT") {
    return AGENT_TARGET_BOOKING_STATUSES
  }

  return BOOKING_STATUS_SET
}

function buildUpdateFailure(
  code: UpdateWorkspaceBookingStatusFailureCode,
  message: string,
): UpdateWorkspaceBookingStatusFailure {
  return {
    ok: false,
    code,
    message,
  }
}

export function canTransitionBookingStatus(
  fromStatus: BookingStatusValue,
  toStatus: BookingStatusValue,
): boolean {
  if (fromStatus === toStatus) {
    return false
  }

  return BOOKING_STATUS_TRANSITIONS[fromStatus].includes(toStatus)
}

export function resolveNextBookingStatus(status: BookingStatusValue): BookingStatusValue | null {
  const candidates = BOOKING_STATUS_TRANSITIONS[status]
  return candidates[0] ?? null
}

export function resolveRoleNextBookingStatus(
  roleCode: "ADMIN" | "SUPER_ADMIN" | "AGENT",
  status: BookingStatusValue,
): BookingStatusValue | null {
  const allowedTargets = resolveRoleAllowedTargetStatuses(roleCode)
  return BOOKING_STATUS_TRANSITIONS[status].find((candidate) => allowedTargets.has(candidate)) ?? null
}

export async function listWorkspaceBookings(
  options: ListWorkspaceBookingsOptions = {},
): Promise<WorkspaceBookingItem[]> {
  const authContext = await requireRole(["ADMIN", "SUPER_ADMIN", "AGENT"], {
    nextPath: options.nextPath,
  })

  if (!db) {
    return []
  }

  const actorUserId = resolveActorUserId(authContext.user)
  const limit = normalizePositiveInt(options.limit, 25, 100)

  const whereClauses: SQL<unknown>[] = [isNull(bookings.deletedAt)]

  if (authContext.roleCode === "AGENT") {
    if (!actorUserId) {
      return []
    }

    whereClauses.push(eq(bookings.assignedAgentUserId, actorUserId))
  }

  const whereExpression =
    whereClauses.length === 1
      ? whereClauses[0]
      : and(...whereClauses)

  const rows = await db
    .select({
      id: bookings.id,
      bookingCode: bookings.bookingCode,
      status: bookings.status,
      projectName: projects.name,
      leadName: leads.fullName,
      assignedAgentName: user.name,
      bookingFeeAmount: bookings.bookingFeeAmount,
      updatedAt: bookings.updatedAt,
    })
    .from(bookings)
    .leftJoin(projects, eq(bookings.projectId, projects.id))
    .leftJoin(leads, eq(bookings.leadId, leads.id))
    .leftJoin(user, eq(bookings.assignedAgentUserId, user.id))
    .where(whereExpression)
    .orderBy(desc(bookings.updatedAt))
    .limit(limit)

  return rows.map((row) => ({
    id: row.id,
    bookingCode: row.bookingCode,
    status: row.status,
    projectName: row.projectName ?? "Unknown",
    leadName: row.leadName ?? "Unknown",
    assignedAgentName: row.assignedAgentName,
    bookingFeeAmount: row.bookingFeeAmount,
    updatedAt: row.updatedAt.toISOString(),
  }))
}

export async function updateWorkspaceBookingStatus(
  input: UpdateWorkspaceBookingStatusInput,
): Promise<UpdateWorkspaceBookingStatusResult> {
  const authContext = await requireRole(["ADMIN", "SUPER_ADMIN", "AGENT"], {
    nextPath: input.nextPath,
  })

  if (!db) {
    return buildUpdateFailure("UPDATE_FAILED", "Booking update service is unavailable.")
  }

  const actorUserId = resolveActorUserId(authContext.user)
  if (!actorUserId) {
    return buildUpdateFailure("UNAUTHENTICATED", "Authentication is required.")
  }

  const roleCode = authContext.roleCode
  if (roleCode !== "ADMIN" && roleCode !== "SUPER_ADMIN" && roleCode !== "AGENT") {
    return buildUpdateFailure("FORBIDDEN", "Only internal users can update booking status.")
  }

  const bookingId = normalizeBookingId(input.bookingId)
  if (!bookingId) {
    return buildUpdateFailure("VALIDATION_FAILED", "Booking id is required.")
  }

  const toStatus = normalizeBookingStatus(input.toStatus)
  if (!toStatus) {
    return buildUpdateFailure("VALIDATION_FAILED", "Target booking status is invalid.")
  }

  const reasonCode = normalizeOptionalText(input.reasonCode, 50)
  const reasonNote = normalizeOptionalText(input.reasonNote, 500)

  if ((toStatus === "REJECTED" || toStatus === "CANCELLED") && !reasonNote) {
    return buildUpdateFailure("VALIDATION_FAILED", "A reason note is required for rejected or cancelled status.")
  }

  try {
    return await db.transaction(async (tx) => {
      const bookingRows = await tx
        .select({
          id: bookings.id,
          status: bookings.status,
          assignedAgentUserId: bookings.assignedAgentUserId,
          rejectionReason: bookings.rejectionReason,
          cancellationReason: bookings.cancellationReason,
        })
        .from(bookings)
        .where(and(eq(bookings.id, bookingId), isNull(bookings.deletedAt)))
        .limit(1)

      const booking = bookingRows[0]
      if (!booking) {
        return buildUpdateFailure("BOOKING_NOT_FOUND", "Booking was not found.")
      }

      const fromStatus = normalizeBookingStatus(booking.status)
      if (!fromStatus) {
        return buildUpdateFailure("UPDATE_FAILED", "Booking status is invalid in database.")
      }

      const allowedTargets = resolveRoleAllowedTargetStatuses(roleCode)
      if (!allowedTargets.has(toStatus)) {
        return buildUpdateFailure("FORBIDDEN", "Your role cannot set this booking status.")
      }

      if (roleCode === "AGENT" && booking.assignedAgentUserId !== actorUserId) {
        return buildUpdateFailure("FORBIDDEN", "Agents can only update bookings assigned to them.")
      }

      if (!canTransitionBookingStatus(fromStatus, toStatus)) {
        return buildUpdateFailure(
          "INVALID_STATUS_TRANSITION",
          `Booking cannot transition from ${fromStatus} to ${toStatus}.`,
        )
      }

      const now = new Date()
      const updateValues: Partial<typeof bookings.$inferInsert> & {
        status: BookingStatusValue
        updatedAt: Date
      } = {
        status: toStatus,
        updatedAt: now,
      }

      if (toStatus === "SUBMITTED") {
        updateValues.submittedAt = now
      }

      if (toStatus === "APPROVED") {
        updateValues.approvedAt = now
        updateValues.approvedByUserId = actorUserId
      }

      if (toStatus === "REJECTED") {
        updateValues.rejectedAt = now
        updateValues.rejectedByUserId = actorUserId
        updateValues.rejectionReason = reasonNote ?? booking.rejectionReason ?? null
      }

      if (toStatus === "EXPIRED") {
        updateValues.expiredAt = now
      }

      if (toStatus === "CANCELLED") {
        updateValues.cancelledAt = now
        updateValues.cancellationReason = reasonNote ?? booking.cancellationReason ?? null
      }

      const updatedRows = await tx
        .update(bookings)
        .set(updateValues)
        .where(eq(bookings.id, bookingId))
        .returning({
          id: bookings.id,
          status: bookings.status,
        })

      const updated = updatedRows[0]
      if (!updated) {
        return buildUpdateFailure("UPDATE_FAILED", "Booking status could not be updated.")
      }

      await tx.insert(bookingStatusHistory).values({
        bookingId,
        fromStatus,
        toStatus,
        changedByUserId: actorUserId,
        changedAt: now,
        reasonCode,
        reasonNote,
        sourceEventType: "MANUAL",
      })

      await tx.insert(bookingActivities).values({
        bookingId,
        actorUserId,
        activityType: "STATUS_CHANGE",
        title: `Status changed to ${toStatus}`,
        body: reasonNote,
        activityAt: now,
        metadata: {
          fromStatus,
          toStatus,
          reasonCode,
          reasonNote,
        },
      })

      await tx.insert(auditLogs).values({
        actorUserId,
        actorRoleId: authContext.roleId,
        actionType: "BOOKING_STATUS_UPDATED",
        entityType: "BOOKING",
        entityId: bookingId,
        beforeJson: {
          status: fromStatus,
        },
        afterJson: {
          status: toStatus,
        },
        changeSummary: `Booking status changed from ${fromStatus} to ${toStatus}`,
        sourceApp: "INTERNAL_PORTAL",
        metadata: {
          eventType: "BOOKING_STATUS_UPDATED",
          actorUserId,
          bookingId,
          fromStatus,
          toStatus,
          reasonCode,
          reasonNote,
        },
      })

      return {
        ok: true,
        bookingId,
        fromStatus,
        toStatus,
      }
    })
  } catch {
    return buildUpdateFailure("UPDATE_FAILED", "Booking status could not be updated.")
  }
}
