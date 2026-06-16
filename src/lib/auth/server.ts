import "server-only"

import { randomUUID } from "crypto"

import { drizzleAdapter } from "@better-auth/drizzle-adapter"
import { betterAuth } from "better-auth"
import { nextCookies } from "better-auth/next-js"
import { phoneNumber } from "better-auth/plugins/phone-number"
import { and, eq, isNull } from "drizzle-orm"

import { ROUTES } from "@/config/routes"
import { db, schema } from "@/db"
import { assertGoogleOAuthEnvConfigured, getAuthRuntimeEnv } from "@/lib/auth/env"
import { writeOtpAuthAuditLog, writeOtpAuthAuditLogStrict } from "@/lib/auth/otp/audit"
import { sendOtpViaProvider } from "@/lib/auth/otp/provider"
import { maskPhone, normalizePhoneToE164 } from "@/lib/auth/otp/phone"
import { OTP_CODE_LENGTH, OTP_TTL_SECONDS, readOtpRuntimeEnv } from "@/lib/auth/otp/policy"
import {
  checkOtpRequestRateLimits,
  hashIpAddress,
  hashRateLimitValue,
  hashUserAgent,
  resolveRequestIp,
} from "@/lib/auth/otp/rate-limit"

const env = getAuthRuntimeEnv()
const googleOAuth = assertGoogleOAuthEnvConfigured()

if (!db) {
  throw new Error("Database client is not available. Auth runtime cannot start.")
}

const authDb = db

type AuthEventStatus = "SUCCESS" | "FAILED"

type AuthAuditLogInput = {
  eventType:
    | "OAUTH_CALLBACK_SUCCESS"
    | "OAUTH_CALLBACK_FAILED"
    | "LOGIN_SUCCESS"
    | "LOGIN_FAILED"
    | "SESSION_CREATED"
  eventStatus: AuthEventStatus
  userId?: string
  providerId?: string
  sessionId?: string
  failureReason?: string
  requestHeaders?: Headers
  metadata?: Record<string, unknown>
}

let customerRoleIdPromise: Promise<string> | undefined

async function resolveCustomerRoleId() {
  if (!customerRoleIdPromise) {
    customerRoleIdPromise = authDb.query.roles
      .findFirst({
        where: (table, { eq: equal }) => equal(table.code, "CUSTOMER"),
        columns: {
          id: true,
        },
      })
      .then((role) => {
        if (!role) {
          throw new Error("Required CUSTOMER role is missing in roles table.")
        }

        return role.id
      })
  }

  return customerRoleIdPromise
}

function getContextPath(context: unknown): string {
  if (!context || typeof context !== "object") {
    return ""
  }

  const value = (context as { path?: unknown }).path
  return typeof value === "string" ? value : ""
}

function getContextProvider(context: unknown): string | undefined {
  if (!context || typeof context !== "object") {
    return undefined
  }

  const body = (context as { body?: unknown }).body
  if (!body || typeof body !== "object") {
    return undefined
  }

  const provider = (body as { provider?: unknown }).provider
  return typeof provider === "string" ? provider : undefined
}

function getContextHeaders(context: unknown): Headers | undefined {
  if (!context || typeof context !== "object") {
    return undefined
  }

  const record = context as {
    headers?: unknown
    request?: {
      headers?: Headers
    }
  }

  if (record.headers instanceof Headers) {
    return record.headers
  }

  return record.request?.headers
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === "string") {
    return error
  }

  return "Unknown authentication error"
}

async function writeAuthAuditLog(input: AuthAuditLogInput) {
  try {
    await authDb.insert(schema.authAuditLogs).values({
      userId: input.userId,
      eventType: input.eventType,
      eventStatus: input.eventStatus,
      providerId: input.providerId,
      sessionId: input.sessionId,
      failureReason: input.failureReason,
      sourceApp: "CUSTOMER_PORTAL",
      ipAddress: input.requestHeaders?.get("x-forwarded-for") ?? null,
      userAgent: input.requestHeaders?.get("user-agent") ?? null,
      riskLevel: input.eventStatus === "FAILED" ? "MEDIUM" : "LOW",
      metadata: input.metadata,
    })
  } catch (error) {
    console.error("Auth audit log write failed", error)
  }
}

function isGoogleOAuthContext(path: string, provider?: string): boolean {
  if (provider === "google") {
    return true
  }

  return path === "/sign-in/social" || path.includes("/callback/google")
}

function selectPhonePluginChannel(runtimeEnv: string) {
  return runtimeEnv.toLowerCase() === "development" ? "DEV_CONSOLE" : "SMS"
}

function createPhoneTempEmail(phoneE164: string): string {
  const normalized = phoneE164.replace(/[^\d]/g, "")
  return `phone-${normalized}@phone.local`
}

function resolveOtpPurposeFromHeaders(headers?: Headers): "LOGIN" | "REGISTER" {
  const value = headers?.get("x-otp-purpose")?.trim()
  return value === "REGISTER" ? "REGISTER" : "LOGIN"
}

function resolveCorrelatedRequestId(headers?: Headers): string {
  const requestId = headers?.get("x-otp-request-id")?.trim()
  return requestId ? requestId.slice(0, 120) : randomUUID()
}

function resolveEndpointHeaders(context?: unknown): Headers | undefined {
  if (!context || typeof context !== "object") {
    return undefined
  }

  const record = context as {
    headers?: unknown
    request?: {
      headers?: Headers
    }
  }

  if (record.headers instanceof Headers) {
    return record.headers
  }

  return record.request?.headers
}

const authSchema = {
  user: schema.user,
  session: schema.session,
  account: schema.account,
  verification: schema.verification,
}

export const auth = betterAuth({
  appName: "PropertyGo JB",
  basePath: env.authBasePath,
  baseURL: env.baseURL,
  secret: env.secret,
  database: drizzleAdapter(authDb, {
    provider: "pg",
    schema: authSchema,
  }),
  socialProviders: {
    google: {
      clientId: googleOAuth.clientId,
      clientSecret: googleOAuth.clientSecret,
      prompt: "select_account",
      disableSignUp: false,
    },
  },
  emailAndPassword: {
    enabled: false,
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
      disableImplicitLinking: false,
      requireLocalEmailVerified: true,
      allowDifferentEmails: false,
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (userRecord) => {
          // Registration should default to CUSTOMER when role is not explicitly provided.
          if (typeof userRecord.roleId === "string" && userRecord.roleId.trim()) {
            return
          }

          const customerRoleId = await resolveCustomerRoleId()

          return {
            data: {
              ...userRecord,
              roleId: customerRoleId,
            },
          }
        },
        after: async (createdUser) => {
          const createdUserId = typeof createdUser.id === "string" ? createdUser.id : undefined
          const hasRole = typeof createdUser.roleId === "string" && createdUser.roleId.trim().length > 0

          if (!createdUserId || hasRole) {
            return
          }

          const customerRoleId = await resolveCustomerRoleId()

          // Fallback guard: if upstream creation flow skipped roleId in payload,
          // ensure registration still persists CUSTOMER as default role.
          await authDb
            .update(schema.user)
            .set({ roleId: customerRoleId })
            .where(and(eq(schema.user.id, createdUserId), isNull(schema.user.roleId)))
        },
      },
    },
    session: {
      create: {
        after: async (sessionRecord, context) => {
          const path = getContextPath(context)
          const provider = getContextProvider(context)

          if (!isGoogleOAuthContext(path, provider)) {
            return
          }

          const requestHeaders = getContextHeaders(context)

          await writeAuthAuditLog({
            userId: sessionRecord.userId,
            providerId: "google",
            sessionId: sessionRecord.id,
            eventType: "OAUTH_CALLBACK_SUCCESS",
            eventStatus: "SUCCESS",
            requestHeaders,
            metadata: { path },
          })

          await writeAuthAuditLog({
            userId: sessionRecord.userId,
            providerId: "google",
            sessionId: sessionRecord.id,
            eventType: "LOGIN_SUCCESS",
            eventStatus: "SUCCESS",
            requestHeaders,
            metadata: { path },
          })

          await writeAuthAuditLog({
            userId: sessionRecord.userId,
            providerId: "google",
            sessionId: sessionRecord.id,
            eventType: "SESSION_CREATED",
            eventStatus: "SUCCESS",
            requestHeaders,
            metadata: {
              path,
            },
          })
        },
      },
    },
  },
  onAPIError: {
    onError: async (error, context) => {
      const path = getContextPath(context)
      const failureReason = extractErrorMessage(error)
      const requestHeaders = getContextHeaders(context)

      if (path && !isGoogleOAuthContext(path)) {
        return
      }

      await writeAuthAuditLog({
        eventType: "OAUTH_CALLBACK_FAILED",
        eventStatus: "FAILED",
        providerId: "google",
        failureReason,
        requestHeaders,
        metadata: { path: path || "unknown" },
      })

      await writeAuthAuditLog({
        eventType: "LOGIN_FAILED",
        eventStatus: "FAILED",
        providerId: "google",
        failureReason,
        requestHeaders,
        metadata: { path: path || "unknown" },
      })
    },
    errorURL: ROUTES.auth.login,
  },
  plugins: [
    phoneNumber({
      otpLength: OTP_CODE_LENGTH,
      expiresIn: OTP_TTL_SECONDS,
      allowedAttempts: 5,
      phoneNumberValidator: async (phoneNumber) => normalizePhoneToE164(phoneNumber).ok,
      signUpOnVerification: {
        getTempEmail: createPhoneTempEmail,
        getTempName: (phoneNumber) => phoneNumber,
      },
      sendOTP: async ({ phoneNumber, code }, ctx) => {
        const normalized = normalizePhoneToE164(phoneNumber)
        if (!normalized.ok) {
          throw new Error("Invalid phone number.")
        }

        const requestHeaders = resolveEndpointHeaders(ctx)
        const runtimeEnv = readOtpRuntimeEnv()
        const requestId = resolveCorrelatedRequestId(requestHeaders)
        const purpose = resolveOtpPurposeFromHeaders(requestHeaders)
        const ipAddress = requestHeaders ? resolveRequestIp(requestHeaders) : undefined
        const userAgent = requestHeaders?.get("user-agent") ?? undefined
        const ipAddressHash = hashIpAddress(ipAddress)
        const userAgentHash = hashUserAgent(userAgent)
        const phoneMasked = maskPhone(normalized.data.phoneE164)
        const channel = selectPhonePluginChannel(runtimeEnv)

        const rateLimitStatus = await checkOtpRequestRateLimits({
          phoneNormalized: normalized.data.phoneNormalized,
          ipAddressHash,
          now: new Date(),
        })

        if (!rateLimitStatus.allowed) {
          await writeOtpAuthAuditLog({
            eventType: "OTP_RESEND_BLOCKED",
            eventStatus: "FAILED",
            requestId,
            providerId: "better-auth-phone-plugin",
            channel,
            phoneMasked,
            ipAddress,
            userAgent,
            failureReason: "RATE_LIMIT_BLOCKED",
            metadata: {
              blockedReason: rateLimitStatus.blockedReason,
            },
          })

          throw new Error("Unable to send code. Please try again later.")
        }

        await writeOtpAuthAuditLogStrict({
          eventType: "OTP_REQUESTED",
          eventStatus: "SUCCESS",
          requestId,
          providerId: "better-auth-phone-plugin",
          channel,
          phoneMasked,
          ipAddress,
          userAgent,
          metadata: {
            purpose,
            phoneRateLimitKey: hashRateLimitValue(normalized.data.phoneNormalized),
            ipAddressHash,
            userAgentHash,
          },
        })

        const sendResult = await sendOtpViaProvider(
          {
            requestId,
            identifier: requestId,
            phoneE164: normalized.data.phoneE164,
            channel,
            otpCode: code,
            ttlSeconds: OTP_TTL_SECONDS,
            purpose,
            metadata: {
              source: "BETTER_AUTH_PHONE_PLUGIN",
            },
          },
          runtimeEnv,
        )

        if (!sendResult.delivered) {
          await writeOtpAuthAuditLog({
            eventType: "OTP_DELIVERY_FAILED",
            eventStatus: "FAILED",
            requestId,
            providerId: sendResult.providerName,
            channel,
            phoneMasked,
            ipAddress,
            userAgent,
            failureReason: sendResult.failureReason ?? "OTP_PROVIDER_FAILED",
          })

          throw new Error(sendResult.failureReason ?? "OTP_PROVIDER_FAILED")
        }

        await writeOtpAuthAuditLog({
          eventType: "OTP_SENT",
          eventStatus: "SUCCESS",
          requestId,
          providerId: sendResult.providerName,
          channel,
          phoneMasked,
          ipAddress,
          userAgent,
          metadata: {
            providerMessageId: sendResult.providerMessageId,
            purpose,
          },
        })
      },
    }),
    nextCookies(),
  ],
})
