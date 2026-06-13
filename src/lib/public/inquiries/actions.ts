import "server-only"

import { and, eq, isNull, or } from "drizzle-orm"

import { db } from "@/db"
import { auditLogs } from "@/db/schema/audit"
import { projects } from "@/db/schema/catalog"
import { inquiries, leadActivities, leadSources, leads } from "@/db/schema/crm-leads"
import { normalizePhoneToE164 } from "@/lib/auth/otp/phone"

const PREFERRED_CONTACT_CHANNELS = ["PHONE", "WHATSAPP", "EMAIL"] as const

type PreferredContactChannel = (typeof PREFERRED_CONTACT_CHANNELS)[number]

export type PublicInquiryType = "CONTACT" | "BOOK_VIEWING"

export type PublicInquiryFieldErrors = Partial<
  Record<
    | "inquiryType"
    | "fullName"
    | "phoneNumber"
    | "email"
    | "message"
    | "projectId"
    | "preferredLanguage"
    | "preferredContactChannel"
    | "preferredVisitDate"
    | "preferredVisitTime"
    | "partySize",
    string
  >
>

export type SubmitPublicInquiryInput = {
  inquiryType?: unknown
  fullName?: unknown
  phoneNumber?: unknown
  email?: unknown
  message?: unknown
  projectId?: unknown
  preferredLanguage?: unknown
  preferredContactChannel?: unknown
  preferredVisitDate?: unknown
  preferredVisitTime?: unknown
  partySize?: unknown
  nextPath?: unknown
}

export type SubmitPublicInquiryFailureCode =
  | "VALIDATION_FAILED"
  | "SOURCE_NOT_FOUND"
  | "PROJECT_NOT_FOUND"
  | "SAVE_FAILED"

export type SubmitPublicInquirySuccess = {
  ok: true
  leadId: string
  inquiryId: string
  message: string
}

export type SubmitPublicInquiryFailure = {
  ok: false
  code: SubmitPublicInquiryFailureCode
  message: string
  fieldErrors?: PublicInquiryFieldErrors
}

export type SubmitPublicInquiryResult = SubmitPublicInquirySuccess | SubmitPublicInquiryFailure

type NormalizedPublicInquiryPayload = {
  inquiryType: PublicInquiryType
  fullName: string
  phoneNumberE164: string
  email: string | null
  message: string | null
  projectId: string | null
  preferredLanguage: string | null
  preferredContactChannel: PreferredContactChannel | null
  preferredVisitDate: string | null
  preferredVisitTime: string | null
  partySize: number | null
  nextPath: string | null
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

function normalizeOptionalEmail(value: unknown): string | null {
  const candidate = normalizeOptionalText(value, 255)
  if (!candidate) {
    return null
  }

  const simpleEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!simpleEmailRegex.test(candidate)) {
    return null
  }

  return candidate.toLowerCase()
}

function normalizeInquiryType(value: unknown): PublicInquiryType | null {
  if (typeof value !== "string") {
    return null
  }

  const normalized = value.trim().toUpperCase()
  if (normalized === "CONTACT" || normalized === "BOOK_VIEWING") {
    return normalized
  }

  return null
}

function normalizePreferredContactChannel(value: unknown): PreferredContactChannel | null {
  if (typeof value !== "string") {
    return null
  }

  const normalized = value.trim().toUpperCase() as PreferredContactChannel
  return PREFERRED_CONTACT_CHANNELS.includes(normalized) ? normalized : null
}

function normalizePartySize(value: unknown): number | null {
  if (typeof value !== "string") {
    return null
  }

  const normalized = value.trim()
  if (!normalized) {
    return null
  }

  if (!/^\d+$/.test(normalized)) {
    return null
  }

  const parsed = Number.parseInt(normalized, 10)
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 20) {
    return null
  }

  return parsed
}

function parseRequestedViewingAt(
  preferredVisitDate: string | null,
  preferredVisitTime: string | null,
): Date | null {
  if (!preferredVisitDate) {
    return null
  }

  const timePortion = preferredVisitTime ? `${preferredVisitTime}:00` : "09:00:00"
  const candidate = new Date(`${preferredVisitDate}T${timePortion}`)

  return Number.isNaN(candidate.getTime()) ? null : candidate
}

function addFieldError(
  fieldErrors: PublicInquiryFieldErrors,
  field: keyof PublicInquiryFieldErrors,
  message: string,
): void {
  if (!fieldErrors[field]) {
    fieldErrors[field] = message
  }
}

function validatePublicInquiryInput(
  input: SubmitPublicInquiryInput,
):
  | {
      ok: true
      payload: NormalizedPublicInquiryPayload
    }
  | {
      ok: false
      message: string
      fieldErrors: PublicInquiryFieldErrors
    } {
  const fieldErrors: PublicInquiryFieldErrors = {}

  const inquiryType = normalizeInquiryType(input.inquiryType)
  if (!inquiryType) {
    addFieldError(fieldErrors, "inquiryType", "Inquiry type is invalid.")
  }

  const fullName = normalizeOptionalText(input.fullName, 150)
  if (!fullName || fullName.length < 2) {
    addFieldError(fieldErrors, "fullName", "Full name is required.")
  }

  const rawPhoneNumber = normalizeOptionalText(input.phoneNumber, 40)
  let phoneNumberE164: string | null = null
  if (!rawPhoneNumber) {
    addFieldError(fieldErrors, "phoneNumber", "Phone number is required.")
  } else {
    const normalizedPhone = normalizePhoneToE164(rawPhoneNumber)
    if (!normalizedPhone.ok) {
      addFieldError(fieldErrors, "phoneNumber", "Phone number format is invalid.")
    } else {
      phoneNumberE164 = normalizedPhone.data.phoneE164
    }
  }

  const rawEmail = normalizeOptionalText(input.email, 255)
  const email = rawEmail ? normalizeOptionalEmail(rawEmail) : null
  if (rawEmail && !email) {
    addFieldError(fieldErrors, "email", "Email format is invalid.")
  }

  const message = normalizeOptionalText(input.message, 2000)
  const projectId = normalizeOptionalText(input.projectId, 120)
  const preferredLanguage = normalizeOptionalText(input.preferredLanguage, 20)
  const preferredContactChannel = normalizePreferredContactChannel(input.preferredContactChannel)
  const preferredVisitDate = normalizeOptionalText(input.preferredVisitDate, 20)
  const preferredVisitTime = normalizeOptionalText(input.preferredVisitTime, 20)
  const partySize = normalizePartySize(input.partySize)
  const nextPath = normalizeOptionalText(input.nextPath, 300)

  if (input.preferredContactChannel && !preferredContactChannel) {
    addFieldError(
      fieldErrors,
      "preferredContactChannel",
      "Preferred contact channel is invalid.",
    )
  }

  if (input.partySize && !partySize) {
    addFieldError(fieldErrors, "partySize", "Party size must be between 1 and 20.")
  }

  if (inquiryType === "CONTACT" && !message) {
    addFieldError(fieldErrors, "message", "Message is required for contact inquiries.")
  }

  if (inquiryType === "BOOK_VIEWING") {
    if (!preferredVisitDate) {
      addFieldError(
        fieldErrors,
        "preferredVisitDate",
        "Preferred visit date is required for viewing requests.",
      )
    }

    if (preferredVisitDate && !parseRequestedViewingAt(preferredVisitDate, preferredVisitTime)) {
      addFieldError(fieldErrors, "preferredVisitTime", "Preferred visit date/time is invalid.")
    }
  }

  if (Object.keys(fieldErrors).length > 0 || !inquiryType || !fullName || !phoneNumberE164) {
    return {
      ok: false,
      message: "Please fix highlighted fields and try again.",
      fieldErrors,
    }
  }

  return {
    ok: true,
    payload: {
      inquiryType,
      fullName,
      phoneNumberE164,
      email,
      message,
      projectId,
      preferredLanguage,
      preferredContactChannel,
      preferredVisitDate,
      preferredVisitTime,
      partySize,
      nextPath,
    },
  }
}

function buildFailure(
  code: SubmitPublicInquiryFailureCode,
  message: string,
  fieldErrors?: PublicInquiryFieldErrors,
): SubmitPublicInquiryFailure {
  return {
    ok: false,
    code,
    message,
    fieldErrors,
  }
}

function resolveDueAt(now: Date, slaMinutes: number | null): Date | null {
  if (!slaMinutes || slaMinutes < 1) {
    return null
  }

  return new Date(now.getTime() + slaMinutes * 60_000)
}

export async function submitPublicInquiry(
  input: SubmitPublicInquiryInput,
): Promise<SubmitPublicInquiryResult> {
  const validation = validatePublicInquiryInput(input)
  if (!validation.ok) {
    return buildFailure("VALIDATION_FAILED", validation.message, validation.fieldErrors)
  }

  if (!db) {
    return buildFailure("SAVE_FAILED", "Inquiry service is unavailable right now.")
  }

  const payload = validation.payload

  const sourceRows = await db
    .select({
      id: leadSources.id,
      code: leadSources.code,
      assignmentSlaMinutes: leadSources.assignmentSlaMinutes,
      firstResponseSlaMinutes: leadSources.firstResponseSlaMinutes,
    })
    .from(leadSources)
    .where(
      and(
        eq(leadSources.code, "WEB_FORM"),
        eq(leadSources.isActive, true),
        isNull(leadSources.deletedAt),
      ),
    )
    .limit(1)

  const source = sourceRows[0]
  if (!source) {
    return buildFailure("SOURCE_NOT_FOUND", "Lead source configuration is missing for WEB_FORM.")
  }

  let projectContext: { id: string; name: string; slug: string } | null = null
  if (payload.projectId) {
    const projectRows = await db
      .select({
        id: projects.id,
        name: projects.name,
        slug: projects.slug,
      })
      .from(projects)
      .where(
        and(
          eq(projects.id, payload.projectId),
          eq(projects.isPublished, true),
          eq(projects.isActive, true),
          isNull(projects.deletedAt),
        ),
      )
      .limit(1)

    projectContext = projectRows[0] ?? null

    if (!projectContext) {
      return buildFailure("PROJECT_NOT_FOUND", "Selected project is not available.", {
        projectId: "Selected project is not available.",
      })
    }
  }

  const now = new Date()
  const assignmentDueAt = resolveDueAt(now, source.assignmentSlaMinutes)
  const firstResponseDueAt = resolveDueAt(now, source.firstResponseSlaMinutes)
  const requestedViewingAt = parseRequestedViewingAt(
    payload.preferredVisitDate,
    payload.preferredVisitTime,
  )

  try {
    return await db.transaction(async (tx) => {
      const existingLeadRows = await tx
        .select({
          id: leads.id,
          sourceId: leads.sourceId,
          email: leads.email,
          preferredLanguage: leads.preferredLanguage,
          assignmentDueAt: leads.assignmentDueAt,
          firstResponseDueAt: leads.firstResponseDueAt,
          firstInquiryAt: leads.firstInquiryAt,
        })
        .from(leads)
        .where(
          and(
            isNull(leads.deletedAt),
            or(
              eq(leads.primaryPhoneNormalized, payload.phoneNumberE164),
              eq(leads.primaryPhoneE164, payload.phoneNumberE164),
            ),
          ),
        )
        .limit(1)

      const existingLead = existingLeadRows[0]
      let leadId: string

      if (existingLead) {
        const updateValues: Partial<typeof leads.$inferInsert> = {
          fullName: payload.fullName,
          email: payload.email ?? existingLead.email,
          preferredLanguage: payload.preferredLanguage ?? existingLead.preferredLanguage,
          lastActivityAt: now,
        }

        if (!existingLead.firstInquiryAt) {
          updateValues.firstInquiryAt = now
        }

        if (!existingLead.assignmentDueAt && assignmentDueAt) {
          updateValues.assignmentDueAt = assignmentDueAt
        }

        if (!existingLead.firstResponseDueAt && firstResponseDueAt) {
          updateValues.firstResponseDueAt = firstResponseDueAt
        }

        const updatedRows = await tx
          .update(leads)
          .set(updateValues)
          .where(eq(leads.id, existingLead.id))
          .returning({ id: leads.id })

        const updatedLead = updatedRows[0]
        if (!updatedLead) {
          return buildFailure("SAVE_FAILED", "Failed to update lead context.")
        }

        leadId = updatedLead.id
      } else {
        const insertedLeadRows = await tx
          .insert(leads)
          .values({
            sourceId: source.id,
            fullName: payload.fullName,
            primaryPhoneE164: payload.phoneNumberE164,
            primaryPhoneNormalized: payload.phoneNumberE164,
            email: payload.email,
            preferredLanguage: payload.preferredLanguage,
            currentStatus: "NEW",
            firstInquiryAt: now,
            lastActivityAt: now,
            assignmentDueAt,
            firstResponseDueAt,
            metadata: {
              firstTouchChannel: "WEB_FORM",
            },
          })
          .returning({ id: leads.id })

        const insertedLead = insertedLeadRows[0]
        if (!insertedLead) {
          return buildFailure("SAVE_FAILED", "Failed to create lead context.")
        }

        leadId = insertedLead.id
      }

      const inquiryRows = await tx
        .insert(inquiries)
        .values({
          leadId,
          sourceId: source.id,
          channel: "WEB_FORM",
          requesterName: payload.fullName,
          requesterPhoneE164: payload.phoneNumberE164,
          requesterPhoneNormalized: payload.phoneNumberE164,
          requesterEmail: payload.email,
          projectId: projectContext?.id ?? null,
          messageText: payload.message,
          payload: {
            inquiryType: payload.inquiryType,
            preferredContactChannel: payload.preferredContactChannel,
            preferredVisitDate: payload.preferredVisitDate,
            preferredVisitTime: payload.preferredVisitTime,
            requestedViewingAt: requestedViewingAt?.toISOString() ?? null,
            partySize: payload.partySize,
            nextPath: payload.nextPath,
          },
          receivedAt: now,
        })
        .returning({ id: inquiries.id })

      const inquiry = inquiryRows[0]
      if (!inquiry) {
        return buildFailure("SAVE_FAILED", "Failed to capture inquiry.")
      }

      await tx.insert(leadActivities).values({
        leadId,
        activityType:
          payload.inquiryType === "BOOK_VIEWING" ? "PUBLIC_VIEWING_REQUESTED" : "PUBLIC_CONTACT_SUBMITTED",
        title:
          payload.inquiryType === "BOOK_VIEWING"
            ? "Public viewing request submitted"
            : "Public contact inquiry submitted",
        body: payload.message,
        dueAt: requestedViewingAt,
        visibilityScope: "INTERNAL",
        metadata: {
          inquiryId: inquiry.id,
          inquiryType: payload.inquiryType,
          projectId: projectContext?.id ?? null,
          projectSlug: projectContext?.slug ?? null,
          preferredContactChannel: payload.preferredContactChannel,
          preferredVisitDate: payload.preferredVisitDate,
          preferredVisitTime: payload.preferredVisitTime,
          partySize: payload.partySize,
        },
      })

      await tx.insert(auditLogs).values({
        actionType: "PUBLIC_INQUIRY_CREATED",
        entityType: "INQUIRY",
        entityId: inquiry.id,
        sourceApp: "PUBLIC_WEB",
        changeSummary:
          payload.inquiryType === "BOOK_VIEWING"
            ? "Public viewing request captured from external funnel."
            : "Public contact inquiry captured from external funnel.",
        afterJson: {
          inquiryId: inquiry.id,
          leadId,
          sourceCode: source.code,
          inquiryType: payload.inquiryType,
          projectId: projectContext?.id ?? null,
        },
        metadata: {
          inquiryId: inquiry.id,
          leadId,
          inquiryType: payload.inquiryType,
          projectId: projectContext?.id ?? null,
          projectSlug: projectContext?.slug ?? null,
          nextPath: payload.nextPath,
        },
      })

      return {
        ok: true,
        leadId,
        inquiryId: inquiry.id,
        message:
          payload.inquiryType === "BOOK_VIEWING"
            ? "Viewing request submitted. Our team will confirm your slot shortly."
            : "Inquiry submitted. Our team will contact you soon.",
      }
    })
  } catch {
    return buildFailure(
      "SAVE_FAILED",
      "Unable to submit your request right now. Please try again shortly.",
    )
  }
}
