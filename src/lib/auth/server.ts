import "server-only"

import { drizzleAdapter } from "@better-auth/drizzle-adapter"
import { betterAuth } from "better-auth"
import { nextCookies } from "better-auth/next-js"

import { ROUTES } from "@/config/routes"
import { db, schema } from "@/db"
import { assertGoogleOAuthEnvConfigured, getAuthRuntimeEnv } from "@/lib/auth/env"

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
        before: async (userRecord, context) => {
          const path = getContextPath(context)
          const provider = getContextProvider(context)

          if (!isGoogleOAuthContext(path, provider)) {
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
  plugins: [nextCookies()],
})
