import "server-only"

import { and, desc, eq, isNull, type SQL } from "drizzle-orm"

import { bookings, bookingParticipants } from "@/db/schema/bookings"
import { db } from "@/db"
import { auditLogs } from "@/db/schema/audit"
import {
  documentRequests,
  documentSubmissions,
  documentTypes,
  documentVerificationLogs,
} from "@/db/schema/documents"
import { bookingActivities } from "@/db/schema/bookings"
import { requireRole } from "@/lib/auth/guards"

export const DOCUMENT_REQUEST_STATUS_VALUES = [
  "REQUESTED",
  "SUBMITTED",
  "VERIFIED",
  "REJECTED",
  "WAIVED",
] as const

export type DocumentRequestStatusValue = (typeof DOCUMENT_REQUEST_STATUS_VALUES)[number]

const DOCUMENT_REQUEST_STATUS_SET = new Set<DocumentRequestStatusValue>(DOCUMENT_REQUEST_STATUS_VALUES)

const DOCUMENT_REQUEST_STATUS_TRANSITIONS: Record<DocumentRequestStatusValue, readonly DocumentRequestStatusValue[]> = {
  REQUESTED: ["SUBMITTED", "WAIVED"],
  SUBMITTED: ["VERIFIED", "REJECTED"],
  VERIFIED: ["REQUESTED"],
  REJECTED: ["SUBMITTED", "WAIVED"],
  WAIVED: ["REQUESTED"],
}

const AGENT_TARGET_REQUEST_STATUSES = new Set<DocumentRequestStatusValue>(["REQUESTED", "SUBMITTED"])

export type WorkspaceDocumentRequestItem = {
  id: string
  bookingCode: string
  documentTypeName: string
  participantName: string | null
  requestStatus: string
  dueAt: string | null
  requestedAt: string
}

type ListWorkspaceDocumentRequestsOptions = {
  nextPath?: string
  limit?: number
}

export type UpdateWorkspaceDocumentRequestStatusInput = {
  requestId: string
  toStatus: DocumentRequestStatusValue
  reasonCode?: string
  reasonNote?: string
  nextPath?: string
}

export type UpdateWorkspaceDocumentRequestStatusFailureCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "VALIDATION_FAILED"
  | "REQUEST_NOT_FOUND"
  | "SUBMISSION_NOT_FOUND"
  | "INVALID_STATUS_TRANSITION"
  | "UPDATE_FAILED"

export type UpdateWorkspaceDocumentRequestStatusSuccess = {
  ok: true
  requestId: string
  bookingId: string
  fromStatus: DocumentRequestStatusValue
  toStatus: DocumentRequestStatusValue
}

export type UpdateWorkspaceDocumentRequestStatusFailure = {
  ok: false
  code: UpdateWorkspaceDocumentRequestStatusFailureCode
  message: string
}

export type UpdateWorkspaceDocumentRequestStatusResult =
  | UpdateWorkspaceDocumentRequestStatusSuccess
  | UpdateWorkspaceDocumentRequestStatusFailure

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

function normalizeRequestId(value: unknown): string | null {
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

function normalizeDocumentRequestStatus(value: unknown): DocumentRequestStatusValue | null {
  if (typeof value !== "string") {
    return null
  }

  const normalized = value.trim().toUpperCase() as DocumentRequestStatusValue
  return DOCUMENT_REQUEST_STATUS_SET.has(normalized) ? normalized : null
}

function resolveRoleAllowedRequestTargetStatuses(
  roleCode: "ADMIN" | "SUPER_ADMIN" | "AGENT",
): ReadonlySet<DocumentRequestStatusValue> {
  if (roleCode === "AGENT") {
    return AGENT_TARGET_REQUEST_STATUSES
  }

  return DOCUMENT_REQUEST_STATUS_SET
}

function buildUpdateFailure(
  code: UpdateWorkspaceDocumentRequestStatusFailureCode,
  message: string,
): UpdateWorkspaceDocumentRequestStatusFailure {
  return {
    ok: false,
    code,
    message,
  }
}

export function canTransitionDocumentRequestStatus(
  fromStatus: DocumentRequestStatusValue,
  toStatus: DocumentRequestStatusValue,
): boolean {
  if (fromStatus === toStatus) {
    return false
  }

  return DOCUMENT_REQUEST_STATUS_TRANSITIONS[fromStatus].includes(toStatus)
}

export function resolveNextDocumentRequestStatus(
  status: DocumentRequestStatusValue,
): DocumentRequestStatusValue | null {
  const candidates = DOCUMENT_REQUEST_STATUS_TRANSITIONS[status]
  return candidates[0] ?? null
}

export function resolveRoleNextDocumentRequestStatus(
  roleCode: "ADMIN" | "SUPER_ADMIN" | "AGENT",
  status: DocumentRequestStatusValue,
): DocumentRequestStatusValue | null {
  const allowedTargets = resolveRoleAllowedRequestTargetStatuses(roleCode)
  return DOCUMENT_REQUEST_STATUS_TRANSITIONS[status].find((candidate) => allowedTargets.has(candidate)) ?? null
}

export async function listWorkspaceDocumentRequests(
  options: ListWorkspaceDocumentRequestsOptions = {},
): Promise<WorkspaceDocumentRequestItem[]> {
  const authContext = await requireRole(["ADMIN", "SUPER_ADMIN", "AGENT"], {
    nextPath: options.nextPath,
  })

  if (!db) {
    return []
  }

  const actorUserId = resolveActorUserId(authContext.user)
  const limit = normalizePositiveInt(options.limit, 25, 100)

  const whereClauses: SQL<unknown>[] = [isNull(documentRequests.deletedAt)]

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
      id: documentRequests.id,
      bookingCode: bookings.bookingCode,
      documentTypeName: documentTypes.name,
      participantName: bookingParticipants.fullName,
      requestStatus: documentRequests.requestStatus,
      dueAt: documentRequests.dueAt,
      requestedAt: documentRequests.requestedAt,
    })
    .from(documentRequests)
    .leftJoin(bookings, eq(documentRequests.bookingId, bookings.id))
    .leftJoin(documentTypes, eq(documentRequests.documentTypeId, documentTypes.id))
    .leftJoin(bookingParticipants, eq(documentRequests.participantId, bookingParticipants.id))
    .where(whereExpression)
    .orderBy(desc(documentRequests.requestedAt))
    .limit(limit)

  return rows.map((row) => ({
    id: row.id,
    bookingCode: row.bookingCode ?? "-",
    documentTypeName: row.documentTypeName ?? "-",
    participantName: row.participantName,
    requestStatus: row.requestStatus,
    dueAt: row.dueAt ? row.dueAt.toISOString() : null,
    requestedAt: row.requestedAt.toISOString(),
  }))
}

export async function updateWorkspaceDocumentRequestStatus(
  input: UpdateWorkspaceDocumentRequestStatusInput,
): Promise<UpdateWorkspaceDocumentRequestStatusResult> {
  const authContext = await requireRole(["ADMIN", "SUPER_ADMIN", "AGENT"], {
    nextPath: input.nextPath,
  })

  if (!db) {
    return buildUpdateFailure("UPDATE_FAILED", "Document request update service is unavailable.")
  }

  const actorUserId = resolveActorUserId(authContext.user)
  if (!actorUserId) {
    return buildUpdateFailure("UNAUTHENTICATED", "Authentication is required.")
  }

  const roleCode = authContext.roleCode
  if (roleCode !== "ADMIN" && roleCode !== "SUPER_ADMIN" && roleCode !== "AGENT") {
    return buildUpdateFailure("FORBIDDEN", "Only internal users can update document request status.")
  }

  const requestId = normalizeRequestId(input.requestId)
  if (!requestId) {
    return buildUpdateFailure("VALIDATION_FAILED", "Document request id is required.")
  }

  const toStatus = normalizeDocumentRequestStatus(input.toStatus)
  if (!toStatus) {
    return buildUpdateFailure("VALIDATION_FAILED", "Target document request status is invalid.")
  }

  const reasonCode = normalizeOptionalText(input.reasonCode, 50)
  const reasonNote = normalizeOptionalText(input.reasonNote, 500)

  if ((toStatus === "REJECTED" || toStatus === "WAIVED") && !reasonNote) {
    return buildUpdateFailure("VALIDATION_FAILED", "A reason note is required for rejected or waived status.")
  }

  try {
    return await db.transaction(async (tx) => {
      const requestRows = await tx
        .select({
          id: documentRequests.id,
          bookingId: documentRequests.bookingId,
          requestStatus: documentRequests.requestStatus,
          assignedAgentUserId: bookings.assignedAgentUserId,
        })
        .from(documentRequests)
        .innerJoin(bookings, eq(documentRequests.bookingId, bookings.id))
        .where(and(eq(documentRequests.id, requestId), isNull(documentRequests.deletedAt), isNull(bookings.deletedAt)))
        .limit(1)

      const request = requestRows[0]
      if (!request) {
        return buildUpdateFailure("REQUEST_NOT_FOUND", "Document request was not found.")
      }

      const fromStatus = normalizeDocumentRequestStatus(request.requestStatus)
      if (!fromStatus) {
        return buildUpdateFailure("UPDATE_FAILED", "Document request status is invalid in database.")
      }

      const allowedTargets = resolveRoleAllowedRequestTargetStatuses(roleCode)
      if (!allowedTargets.has(toStatus)) {
        return buildUpdateFailure("FORBIDDEN", "Your role cannot set this document request status.")
      }

      if (roleCode === "AGENT" && request.assignedAgentUserId !== actorUserId) {
        return buildUpdateFailure("FORBIDDEN", "Agents can only update document requests for assigned bookings.")
      }

      if (!canTransitionDocumentRequestStatus(fromStatus, toStatus)) {
        return buildUpdateFailure(
          "INVALID_STATUS_TRANSITION",
          `Document request cannot transition from ${fromStatus} to ${toStatus}.`,
        )
      }

      const now = new Date()

      const updateValues: Partial<typeof documentRequests.$inferInsert> & {
        requestStatus: DocumentRequestStatusValue
        updatedAt: Date
      } = {
        requestStatus: toStatus,
        updatedAt: now,
      }

      if (reasonNote) {
        updateValues.notes = reasonNote
      }

      if (toStatus === "WAIVED") {
        updateValues.waivedAt = now
        updateValues.waivedByUserId = actorUserId
        updateValues.waiveReason = reasonNote
      } else if (fromStatus === "WAIVED") {
        updateValues.waivedAt = null
        updateValues.waivedByUserId = null
        updateValues.waiveReason = null
      }

      if (toStatus === "REQUESTED") {
        updateValues.requestedAt = now
        updateValues.requestedByUserId = actorUserId
      }

      const updatedRows = await tx
        .update(documentRequests)
        .set(updateValues)
        .where(eq(documentRequests.id, requestId))
        .returning({
          id: documentRequests.id,
          requestStatus: documentRequests.requestStatus,
          bookingId: documentRequests.bookingId,
        })

      const updated = updatedRows[0]
      if (!updated) {
        return buildUpdateFailure("UPDATE_FAILED", "Document request status could not be updated.")
      }

      if (toStatus === "VERIFIED" || toStatus === "REJECTED") {
        const submissionRows = await tx
          .select({
            id: documentSubmissions.id,
          })
          .from(documentSubmissions)
          .where(and(eq(documentSubmissions.requestId, requestId), isNull(documentSubmissions.deletedAt)))
          .orderBy(desc(documentSubmissions.versionNo), desc(documentSubmissions.createdAt))
          .limit(1)

        const latestSubmission = submissionRows[0]
        if (!latestSubmission) {
          return buildUpdateFailure(
            "SUBMISSION_NOT_FOUND",
            "A document submission is required before verification or rejection.",
          )
        }

        const nextSubmissionStatus = toStatus === "VERIFIED" ? "VERIFIED" : "REJECTED"

        await tx
          .update(documentSubmissions)
          .set({
            submissionStatus: nextSubmissionStatus,
            updatedAt: now,
          })
          .where(eq(documentSubmissions.id, latestSubmission.id))

        await tx.insert(documentVerificationLogs).values({
          submissionId: latestSubmission.id,
          bookingId: request.bookingId,
          verificationStatus: nextSubmissionStatus,
          verifiedByUserId: actorUserId,
          verifiedAt: now,
          reasonCode,
          reasonNote,
          checklistJson: null,
        })
      }

      await tx.insert(bookingActivities).values({
        bookingId: request.bookingId,
        actorUserId,
        activityType:
          toStatus === "VERIFIED"
            ? "DOCUMENT_VERIFIED"
            : toStatus === "REQUESTED" || toStatus === "SUBMITTED" || toStatus === "WAIVED"
              ? "DOCUMENT_REQUESTED"
              : "STATUS_CHANGE",
        title: `Document request status changed to ${toStatus}`,
        body: reasonNote,
        activityAt: now,
        metadata: {
          requestId,
          fromStatus,
          toStatus,
          reasonCode,
          reasonNote,
        },
      })

      await tx.insert(auditLogs).values({
        actorUserId,
        actorRoleId: authContext.roleId,
        actionType: "DOCUMENT_REQUEST_STATUS_UPDATED",
        entityType: "DOCUMENT_REQUEST",
        entityId: requestId,
        beforeJson: {
          requestStatus: fromStatus,
        },
        afterJson: {
          requestStatus: toStatus,
        },
        changeSummary: `Document request status changed from ${fromStatus} to ${toStatus}`,
        sourceApp: "INTERNAL_PORTAL",
        metadata: {
          eventType: "DOCUMENT_REQUEST_STATUS_UPDATED",
          actorUserId,
          requestId,
          bookingId: request.bookingId,
          fromStatus,
          toStatus,
          reasonCode,
          reasonNote,
        },
      })

      return {
        ok: true,
        requestId,
        bookingId: request.bookingId,
        fromStatus,
        toStatus,
      }
    })
  } catch {
    return buildUpdateFailure("UPDATE_FAILED", "Document request status could not be updated.")
  }
}
