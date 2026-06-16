import "server-only"

import { db, schema } from "@/db"
import type { OtpAuthAuditEventType } from "@/lib/auth/otp/types"

type OtpAuditLogInput = {
  eventType: OtpAuthAuditEventType
  eventStatus: "SUCCESS" | "FAILED"
  requestId: string
  providerId?: string
  channel?: string
  phoneMasked?: string
  ipAddress?: string
  userAgent?: string
  failureReason?: string
  riskLevel?: "LOW" | "MEDIUM" | "HIGH"
  metadata?: Record<string, unknown>
}

const SOURCE_APP = "CUSTOMER_PORTAL"

function toSafeMetadata(input: OtpAuditLogInput): Record<string, unknown> {
  return {
    requestId: input.requestId,
    channel: input.channel,
    phoneMasked: input.phoneMasked,
    ...input.metadata,
  }
}

export async function writeOtpAuthAuditLog(input: OtpAuditLogInput): Promise<void> {
  if (!db) {
    return
  }

  try {
    await db.insert(schema.authAuditLogs).values({
      eventType: input.eventType,
      eventStatus: input.eventStatus,
      providerId: input.providerId,
      failureReason: input.failureReason,
      riskLevel: input.riskLevel ?? (input.eventStatus === "FAILED" ? "MEDIUM" : "LOW"),
      sourceApp: SOURCE_APP,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      metadata: toSafeMetadata(input),
    })
  } catch (error) {
    console.error("OTP auth audit log write failed", error)
  }
}

export async function writeOtpAuthAuditLogStrict(input: OtpAuditLogInput): Promise<void> {
  if (!db) {
    throw new Error("Database client is not available. OTP audit tracking cannot proceed.")
  }

  await db.insert(schema.authAuditLogs).values({
    eventType: input.eventType,
    eventStatus: input.eventStatus,
    providerId: input.providerId,
    failureReason: input.failureReason,
    riskLevel: input.riskLevel ?? (input.eventStatus === "FAILED" ? "MEDIUM" : "LOW"),
    sourceApp: SOURCE_APP,
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
    metadata: toSafeMetadata(input),
  })
}
