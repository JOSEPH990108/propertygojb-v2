import "server-only"

import { createHmac } from "crypto"
import { and, eq, gte, sql } from "drizzle-orm"

import { db, schema } from "@/db"
import {
  OTP_REQUEST_RATE_LIMIT_MAX_PER_IP,
  OTP_REQUEST_RATE_LIMIT_MAX_PER_PHONE,
  OTP_REQUEST_RATE_LIMIT_WINDOW_SECONDS,
} from "@/lib/auth/otp/policy"
import type { OtpRateLimitStatus } from "@/lib/auth/otp/types"

function getRateLimitHashSecret(): string {
  const secret = process.env.OTP_RATE_LIMIT_SECRET ?? process.env.BETTER_AUTH_SECRET ?? process.env.AUTH_SECRET
  if (!secret) {
    throw new Error("OTP rate-limit hash secret is missing.")
  }

  return secret
}

export function hashRateLimitValue(value: string): string {
  return createHmac("sha256", getRateLimitHashSecret()).update(value).digest("hex")
}

export function resolveRequestIp(headers: Headers): string | undefined {
  const forwarded = headers.get("x-forwarded-for")
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim()
    if (first) {
      return first
    }
  }

  const realIp = headers.get("x-real-ip")?.trim()
  return realIp || undefined
}

export function hashIpAddress(ipAddress?: string): string | undefined {
  if (!ipAddress) {
    return undefined
  }

  return hashRateLimitValue(ipAddress)
}

export function hashUserAgent(userAgent?: string): string | undefined {
  if (!userAgent) {
    return undefined
  }

  return hashRateLimitValue(userAgent)
}

export async function checkOtpRequestRateLimits(input: {
  phoneNormalized: string
  ipAddressHash?: string
  now?: Date
}): Promise<OtpRateLimitStatus> {
  if (!db) {
    throw new Error("Database client is not available. OTP runtime cannot process requests.")
  }

  const now = input.now ?? new Date()
  const windowStart = new Date(now.getTime() - OTP_REQUEST_RATE_LIMIT_WINDOW_SECONDS * 1000)
  const phoneRateLimitKey = hashRateLimitValue(input.phoneNormalized)

  const phoneResult = await db
    .select({
      count: sql<number>`count(*)::int`,
    })
    .from(schema.authAuditLogs)
    .where(
      and(
        eq(schema.authAuditLogs.eventType, "OTP_REQUESTED"),
        eq(sql<string>`coalesce(${schema.authAuditLogs.metadata}->>'phoneRateLimitKey', '')`, phoneRateLimitKey),
        gte(schema.authAuditLogs.occurredAt, windowStart),
      ),
    )

  const ipCount = input.ipAddressHash
    ? (
        await db
          .select({
            count: sql<number>`count(*)::int`,
          })
          .from(schema.authAuditLogs)
          .where(
            and(
              eq(schema.authAuditLogs.eventType, "OTP_REQUESTED"),
              eq(sql<string>`coalesce(${schema.authAuditLogs.metadata}->>'ipAddressHash', '')`, input.ipAddressHash),
              gte(schema.authAuditLogs.occurredAt, windowStart),
            ),
          )
      )[0]?.count ?? 0
    : 0

  const phoneCount = phoneResult[0]?.count ?? 0

  if (phoneCount >= OTP_REQUEST_RATE_LIMIT_MAX_PER_PHONE) {
    return {
      allowed: false,
      phoneCount,
      ipCount,
      maxPerPhone: OTP_REQUEST_RATE_LIMIT_MAX_PER_PHONE,
      maxPerIp: OTP_REQUEST_RATE_LIMIT_MAX_PER_IP,
      blockedReason: "PHONE_LIMIT",
    }
  }

  if (input.ipAddressHash && ipCount >= OTP_REQUEST_RATE_LIMIT_MAX_PER_IP) {
    return {
      allowed: false,
      phoneCount,
      ipCount,
      maxPerPhone: OTP_REQUEST_RATE_LIMIT_MAX_PER_PHONE,
      maxPerIp: OTP_REQUEST_RATE_LIMIT_MAX_PER_IP,
      blockedReason: "IP_LIMIT",
    }
  }

  return {
    allowed: true,
    phoneCount,
    ipCount,
    maxPerPhone: OTP_REQUEST_RATE_LIMIT_MAX_PER_PHONE,
    maxPerIp: OTP_REQUEST_RATE_LIMIT_MAX_PER_IP,
  }
}
