import "server-only"

import { randomInt, randomUUID } from "crypto"
import { and, eq, gt, isNull, lte, sql } from "drizzle-orm"

import { db, schema } from "@/db"
import { writeOtpAuthAuditLog } from "@/lib/auth/otp/audit"
import { hashOtpCode } from "@/lib/auth/otp/hash"
import { maskPhone, normalizePhoneToE164 } from "@/lib/auth/otp/phone"
import {
  OTP_CODE_LENGTH,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_COOLDOWN_SECONDS,
  OTP_TTL_SECONDS,
  readOtpRuntimeEnv,
} from "@/lib/auth/otp/policy"
import { hashIpAddress, hashUserAgent, resolveRequestIp, checkOtpRequestRateLimits } from "@/lib/auth/otp/rate-limit"
import { OtpProviderError, sendOtpViaProvider } from "@/lib/auth/otp/provider"
import type {
  OtpChannel,
  OtpPurpose,
  OtpRequestContext,
  OtpRequestFailureResponse,
  OtpRequestPayload,
  OtpRequestResponse,
  OtpRequestSuccessResponse,
} from "@/lib/auth/otp/types"

const OTP_REQUEST_FAILURE: OtpRequestFailureResponse = {
  ok: false,
  message: "Unable to send code. Please try again later.",
}

function isOtpPurpose(value: string): value is OtpPurpose {
  return value === "LOGIN" || value === "REGISTER"
}

function createOtpCode(): string {
  const maxExclusive = 10 ** OTP_CODE_LENGTH
  return String(randomInt(0, maxExclusive)).padStart(OTP_CODE_LENGTH, "0")
}

function createChallengeIdentifier(): string {
  return randomUUID()
}

function selectRequestChannel(runtimeEnv: string): OtpChannel {
  if (runtimeEnv.toLowerCase() === "development") {
    return "DEV_CONSOLE"
  }

  throw new OtpProviderError(
    "OTP_PROVIDER_ENV_BLOCKED",
    "No OTP request channel is available for this environment.",
  )
}

function getSafeRequestContext(headers?: Headers): OtpRequestContext {
  if (!headers) {
    return {}
  }

  return {
    ipAddress: resolveRequestIp(headers),
    userAgent: headers.get("user-agent") ?? undefined,
  }
}

async function closeExpiredActiveChallenges(input: {
  phoneNormalized: string
  purpose: OtpPurpose
  now: Date
}): Promise<void> {
  if (!db) {
    throw new Error("Database client is not available. OTP runtime cannot process requests.")
  }

  await db
    .update(schema.otpChallenges)
    .set({
      lockedAt: input.now,
      metadata: {
        systemReason: "EXPIRED_ACTIVE_CLOSED",
      },
    })
    .where(
      and(
        eq(schema.otpChallenges.phoneNormalized, input.phoneNormalized),
        eq(schema.otpChallenges.purpose, input.purpose),
        isNull(schema.otpChallenges.consumedAt),
        isNull(schema.otpChallenges.lockedAt),
        lte(schema.otpChallenges.expiresAt, input.now),
      ),
    )
}

async function findActiveChallenge(input: {
  phoneNormalized: string
  purpose: OtpPurpose
  now: Date
}) {
  if (!db) {
    throw new Error("Database client is not available. OTP runtime cannot process requests.")
  }

  return db.query.otpChallenges.findFirst({
    where: and(
      eq(schema.otpChallenges.phoneNormalized, input.phoneNormalized),
      eq(schema.otpChallenges.purpose, input.purpose),
      isNull(schema.otpChallenges.consumedAt),
      isNull(schema.otpChallenges.lockedAt),
      gt(schema.otpChallenges.expiresAt, input.now),
    ),
    orderBy: (table, { desc }) => [desc(table.createdAt)],
  })
}

async function lockChallengeForReplacement(challengeId: string, now: Date): Promise<void> {
  if (!db) {
    throw new Error("Database client is not available. OTP runtime cannot process requests.")
  }

  await db
    .update(schema.otpChallenges)
    .set({
      lockedAt: now,
      metadata: {
        systemReason: "RESEND_REPLACED",
      },
    })
    .where(eq(schema.otpChallenges.id, challengeId))
}

async function markSendAttempt(identifier: string, now: Date): Promise<void> {
  if (!db) {
    throw new Error("Database client is not available. OTP runtime cannot process requests.")
  }

  await db
    .update(schema.otpChallenges)
    .set({
      sendCount: 1,
      lastSentAt: now,
    })
    .where(eq(schema.otpChallenges.identifier, identifier))
}

function toSafeFailureReason(failureReason: string): string {
  return failureReason.trim().slice(0, 120) || "OTP_DELIVERY_FAILED"
}

async function lockChallengeDeliveryFailed(
  identifier: string,
  now: Date,
  failureReason: string,
): Promise<void> {
  if (!db) {
    throw new Error("Database client is not available. OTP runtime cannot process requests.")
  }

  await db
    .update(schema.otpChallenges)
    .set({
      lockedAt: now,
      metadata: sql`coalesce(${schema.otpChallenges.metadata}, '{}'::jsonb) || jsonb_build_object(
        'systemReason', 'OTP_DELIVERY_FAILED',
        'deliveryFailureReason', ${toSafeFailureReason(failureReason)}
      )`,
    })
    .where(eq(schema.otpChallenges.identifier, identifier))
}

function toSuccessResponse(payload: { identifier: string; resendAvailableAt: Date }): OtpRequestSuccessResponse {
  return {
    ok: true,
    identifier: payload.identifier,
    resendAvailableAt: payload.resendAvailableAt.toISOString(),
  }
}

function isUniqueConstraintViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false
  }

  const code = (error as { code?: unknown }).code
  return code === "23505"
}

async function insertOtpChallenge(input: {
  identifier: string
  requestId: string
  phoneE164: string
  phoneNormalized: string
  purpose: OtpPurpose
  channel: OtpChannel
  otpHash: string
  expiresAt: Date
  resendAvailableAt: Date
  ipAddressHash?: string
  userAgentHash?: string
  userAgent?: string
}): Promise<void> {
  if (!db) {
    throw new Error("Database client is not available. OTP runtime cannot process requests.")
  }

  await db.insert(schema.otpChallenges).values({
    identifier: input.identifier,
    phoneE164: input.phoneE164,
    phoneNormalized: input.phoneNormalized,
    purpose: input.purpose,
    channel: input.channel,
    otpHash: input.otpHash,
    expiresAt: input.expiresAt,
    resendAvailableAt: input.resendAvailableAt,
    maxAttempts: OTP_MAX_ATTEMPTS,
    attemptCount: 0,
    sendCount: 0,
    requestId: input.requestId,
    ipAddressHash: input.ipAddressHash,
    userAgentHash: input.userAgentHash,
    userAgent: input.userAgent,
    metadata: {
      scope: "OTP_REQUEST",
    },
  })
}

export async function requestOtpCode(
  payload: OtpRequestPayload,
  requestHeaders?: Headers,
): Promise<OtpRequestResponse> {
  if (!db) {
    return OTP_REQUEST_FAILURE
  }

  const requestId = randomUUID()
  const runtimeEnv = readOtpRuntimeEnv()
  const safeContext = getSafeRequestContext(requestHeaders)
  const ipAddressHash = hashIpAddress(safeContext.ipAddress)
  const userAgentHash = hashUserAgent(safeContext.userAgent)

  if (!isOtpPurpose(payload.purpose)) {
    return OTP_REQUEST_FAILURE
  }

  const normalizedPhone = normalizePhoneToE164(payload.phoneNumber)
  if (!normalizedPhone.ok) {
    return OTP_REQUEST_FAILURE
  }

  const now = new Date()
  const phoneMasked = maskPhone(normalizedPhone.data.phoneE164)

  const rateLimitStatus = await checkOtpRequestRateLimits({
    phoneNormalized: normalizedPhone.data.phoneNormalized,
    ipAddressHash,
    now,
  })

  if (!rateLimitStatus.allowed) {
    await writeOtpAuthAuditLog({
      eventType: "OTP_RESEND_BLOCKED",
      eventStatus: "FAILED",
      requestId,
      phoneMasked,
      ipAddress: safeContext.ipAddress,
      userAgent: safeContext.userAgent,
      failureReason: "RATE_LIMIT_BLOCKED",
      metadata: {
        blockedReason: rateLimitStatus.blockedReason,
      },
    })

    return OTP_REQUEST_FAILURE
  }

  await closeExpiredActiveChallenges({
    phoneNormalized: normalizedPhone.data.phoneNormalized,
    purpose: payload.purpose,
    now,
  })

  const existingActiveChallenge = await findActiveChallenge({
    phoneNormalized: normalizedPhone.data.phoneNormalized,
    purpose: payload.purpose,
    now,
  })

  if (existingActiveChallenge && existingActiveChallenge.resendAvailableAt > now) {
    await writeOtpAuthAuditLog({
      eventType: "OTP_RESEND_BLOCKED",
      eventStatus: "FAILED",
      requestId,
      providerId: "dev-console",
      channel: existingActiveChallenge.channel,
      phoneMasked,
      ipAddress: safeContext.ipAddress,
      userAgent: safeContext.userAgent,
      failureReason: "RESEND_COOLDOWN_ACTIVE",
      metadata: {
        identifier: existingActiveChallenge.identifier,
        resendAvailableAt: existingActiveChallenge.resendAvailableAt.toISOString(),
      },
    })

    return toSuccessResponse({
      identifier: existingActiveChallenge.identifier,
      resendAvailableAt: existingActiveChallenge.resendAvailableAt,
    })
  }

  if (existingActiveChallenge) {
    await lockChallengeForReplacement(existingActiveChallenge.id, now)
  }

  const identifier = createChallengeIdentifier()
  const otpCode = createOtpCode()
  const otpHash = hashOtpCode({ identifier, otpCode })
  const channel = selectRequestChannel(runtimeEnv)
  const expiresAt = new Date(now.getTime() + OTP_TTL_SECONDS * 1000)
  const resendAvailableAt = new Date(now.getTime() + OTP_RESEND_COOLDOWN_SECONDS * 1000)

  try {
    await insertOtpChallenge({
      identifier,
      requestId,
      phoneE164: normalizedPhone.data.phoneE164,
      phoneNormalized: normalizedPhone.data.phoneNormalized,
      purpose: payload.purpose,
      channel,
      otpHash,
      expiresAt,
      resendAvailableAt,
      ipAddressHash,
      userAgentHash,
      userAgent: safeContext.userAgent,
    })
  } catch (error) {
    if (isUniqueConstraintViolation(error)) {
      const activeChallengeAfterConflict = await findActiveChallenge({
        phoneNormalized: normalizedPhone.data.phoneNormalized,
        purpose: payload.purpose,
        now,
      })

      if (activeChallengeAfterConflict) {
        return toSuccessResponse({
          identifier: activeChallengeAfterConflict.identifier,
          resendAvailableAt: activeChallengeAfterConflict.resendAvailableAt,
        })
      }
    }

    await writeOtpAuthAuditLog({
      eventType: "OTP_DELIVERY_FAILED",
      eventStatus: "FAILED",
      requestId,
      channel,
      phoneMasked,
      ipAddress: safeContext.ipAddress,
      userAgent: safeContext.userAgent,
      failureReason: "OTP_CHALLENGE_INSERT_FAILED",
    })

    return OTP_REQUEST_FAILURE
  }

  await writeOtpAuthAuditLog({
    eventType: "OTP_REQUESTED",
    eventStatus: "SUCCESS",
    requestId,
    channel,
    phoneMasked,
    ipAddress: safeContext.ipAddress,
    userAgent: safeContext.userAgent,
    metadata: {
      identifier,
      purpose: payload.purpose,
    },
  })

  try {
    const providerResult = await sendOtpViaProvider(
      {
        requestId,
        identifier,
        phoneE164: normalizedPhone.data.phoneE164,
        channel,
        otpCode,
        ttlSeconds: OTP_TTL_SECONDS,
        purpose: payload.purpose,
        metadata: {
          source: "OTP_REQUEST_ENDPOINT",
        },
      },
      runtimeEnv,
    )

    await markSendAttempt(identifier, new Date())

    if (!providerResult.delivered) {
      await lockChallengeDeliveryFailed(
        identifier,
        new Date(),
        providerResult.failureReason ?? "OTP_PROVIDER_FAILED",
      )

      await writeOtpAuthAuditLog({
        eventType: "OTP_DELIVERY_FAILED",
        eventStatus: "FAILED",
        requestId,
        providerId: providerResult.providerName,
        channel,
        phoneMasked,
        ipAddress: safeContext.ipAddress,
        userAgent: safeContext.userAgent,
        failureReason: providerResult.failureReason ?? "OTP_PROVIDER_FAILED",
      })

      return OTP_REQUEST_FAILURE
    }

    await writeOtpAuthAuditLog({
      eventType: "OTP_SENT",
      eventStatus: "SUCCESS",
      requestId,
      providerId: providerResult.providerName,
      channel,
      phoneMasked,
      ipAddress: safeContext.ipAddress,
      userAgent: safeContext.userAgent,
      metadata: {
        providerMessageId: providerResult.providerMessageId,
      },
    })

    return toSuccessResponse({
      identifier,
      resendAvailableAt,
    })
  } catch (error) {
    await markSendAttempt(identifier, new Date())

    const failureReason = error instanceof Error ? error.message : "OTP_PROVIDER_REQUEST_FAILED"

    await lockChallengeDeliveryFailed(identifier, new Date(), failureReason)

    await writeOtpAuthAuditLog({
      eventType: "OTP_DELIVERY_FAILED",
      eventStatus: "FAILED",
      requestId,
      providerId: "dev-console",
      channel,
      phoneMasked,
      ipAddress: safeContext.ipAddress,
      userAgent: safeContext.userAgent,
      failureReason,
    })

    return OTP_REQUEST_FAILURE
  }
}
