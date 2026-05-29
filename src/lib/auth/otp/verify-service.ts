import "server-only"

import { randomUUID } from "crypto"

import { db } from "@/db"
import { ROUTES } from "@/config/routes"
import { auth } from "@/lib/auth/server"
import { writeOtpAuthAuditLog } from "@/lib/auth/otp/audit"
import { maskPhone, normalizePhoneToE164 } from "@/lib/auth/otp/phone"
import type { OtpVerifyPayload, OtpVerifyResponse } from "@/lib/auth/otp/types"

const OTP_VERIFY_FAILURE: OtpVerifyResponse = {
  ok: false,
  message: "Invalid or expired code.",
}

const OTP_CODE_REGEX = /^\d{6}$/

type VerifyResult = {
  response: OtpVerifyResponse
  setCookieHeaders: string[]
}

function resolveRequestId(headers?: Headers): string {
  const requestId = headers?.get("x-otp-request-id")?.trim()
  return requestId ? requestId.slice(0, 120) : randomUUID()
}

function normalizeFailureReason(error: unknown): string {
  if (error instanceof Error) {
    return error.message.slice(0, 120) || "OTP_VERIFY_FAILED"
  }

  if (typeof error === "string") {
    return error.slice(0, 120) || "OTP_VERIFY_FAILED"
  }

  return "OTP_VERIFY_FAILED"
}

function isMaxAttemptsError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false
  }

  const candidate = error as { code?: unknown; message?: unknown; body?: unknown }
  const code = typeof candidate.code === "string" ? candidate.code : ""
  const message = typeof candidate.message === "string" ? candidate.message : ""
  const bodyCode =
    candidate.body && typeof candidate.body === "object"
      ? String((candidate.body as { code?: unknown }).code ?? "")
      : ""

  return (
    code.toUpperCase().includes("TOO_MANY_ATTEMPTS") ||
    bodyCode.toUpperCase().includes("TOO_MANY_ATTEMPTS") ||
    message.toUpperCase().includes("TOO_MANY_ATTEMPTS")
  )
}

function readSetCookieHeaders(headers: Headers): string[] {
  const withGetSetCookie = headers as Headers & { getSetCookie?: () => string[] }
  const values = withGetSetCookie.getSetCookie?.()

  if (values && values.length > 0) {
    return values
  }

  const raw = headers.get("set-cookie")
  return raw ? [raw] : []
}

function parseCookieHeader(cookieHeader?: string | null): Map<string, string> {
  const map = new Map<string, string>()
  if (!cookieHeader) {
    return map
  }

  for (const chunk of cookieHeader.split(";")) {
    const entry = chunk.trim()
    if (!entry) {
      continue
    }

    const separator = entry.indexOf("=")
    if (separator <= 0) {
      continue
    }

    const name = entry.slice(0, separator).trim()
    const value = entry.slice(separator + 1).trim()
    if (!name) {
      continue
    }

    map.set(name, value)
  }

  return map
}

function mergeCookieHeader(existingCookieHeader: string | null, setCookieHeaders: string[]): string | null {
  const merged = parseCookieHeader(existingCookieHeader)

  for (const setCookie of setCookieHeaders) {
    const firstPart = setCookie.split(";")[0]?.trim()
    if (!firstPart) {
      continue
    }

    const separator = firstPart.indexOf("=")
    if (separator <= 0) {
      continue
    }

    const name = firstPart.slice(0, separator).trim()
    const value = firstPart.slice(separator + 1).trim()
    if (!name) {
      continue
    }

    merged.set(name, value)
  }

  if (merged.size === 0) {
    return null
  }

  return Array.from(merged.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join("; ")
}

async function resolveRoleCode(input: { role?: unknown; roleId?: unknown }): Promise<string | undefined> {
  if (typeof input.role === "string" && input.role.trim()) {
    return input.role.trim().toUpperCase()
  }

  if (typeof input.roleId !== "string" || !input.roleId || !db) {
    return undefined
  }

  const roleId = input.roleId

  const role = await db.query.roles.findFirst({
    where: (table, { eq }) => eq(table.id, roleId),
    columns: {
      code: true,
    },
  })

  return role?.code?.toUpperCase()
}

function mapRoleToRedirect(roleCode?: string): string {
  switch (roleCode) {
    case "CUSTOMER":
      return ROUTES.public.home
    case "AGENT":
      return ROUTES.agent.dashboard
    case "ADMIN":
    case "SUPER_ADMIN":
      return ROUTES.admin.dashboard
    default:
      return ROUTES.auth.loginUnknownRoleError
  }
}

export async function verifyOtpCode(payload: OtpVerifyPayload, requestHeaders?: Headers): Promise<VerifyResult> {
  const requestId = resolveRequestId(requestHeaders)

  const normalizedPhone = normalizePhoneToE164(payload.phoneNumber)
  if (!normalizedPhone.ok || !OTP_CODE_REGEX.test(payload.code)) {
    return {
      response: OTP_VERIFY_FAILURE,
      setCookieHeaders: [],
    }
  }

  const phoneMasked = maskPhone(normalizedPhone.data.phoneE164)

  try {
    const verifyResult = await auth.api.verifyPhoneNumber({
      body: {
        phoneNumber: normalizedPhone.data.phoneE164,
        code: payload.code,
      },
      headers: requestHeaders,
      returnHeaders: true,
    })

    const setCookieHeaders = readSetCookieHeaders(verifyResult.headers)

    if (!verifyResult.response?.status) {
      await writeOtpAuthAuditLog({
        eventType: "OTP_VERIFY_FAILED",
        eventStatus: "FAILED",
        requestId,
        providerId: "better-auth-phone-plugin",
        phoneMasked,
        ipAddress: requestHeaders?.get("x-forwarded-for") ?? undefined,
        userAgent: requestHeaders?.get("user-agent") ?? undefined,
        failureReason: "OTP_VERIFY_STATUS_FALSE",
      })

      return {
        response: OTP_VERIFY_FAILURE,
        setCookieHeaders,
      }
    }

    await writeOtpAuthAuditLog({
      eventType: "OTP_VERIFY_SUCCESS",
      eventStatus: "SUCCESS",
      requestId,
      providerId: "better-auth-phone-plugin",
      phoneMasked,
      ipAddress: requestHeaders?.get("x-forwarded-for") ?? undefined,
      userAgent: requestHeaders?.get("user-agent") ?? undefined,
      metadata: {
        verifyStatus: verifyResult.response.status,
      },
    })

    const sessionHeaders = new Headers(requestHeaders ?? undefined)
    const mergedCookie = mergeCookieHeader(requestHeaders?.get("cookie") ?? null, setCookieHeaders)
    if (mergedCookie) {
      sessionHeaders.set("cookie", mergedCookie)
    }

    const sessionResult = await auth.api.getSession({
      headers: sessionHeaders,
    })

    if (!sessionResult?.session || !sessionResult.user) {
      await writeOtpAuthAuditLog({
        eventType: "OTP_VERIFY_FAILED",
        eventStatus: "FAILED",
        requestId,
        providerId: "better-auth-phone-plugin",
        phoneMasked,
        ipAddress: requestHeaders?.get("x-forwarded-for") ?? undefined,
        userAgent: requestHeaders?.get("user-agent") ?? undefined,
        failureReason: "SESSION_CONFIRMATION_FAILED",
      })

      return {
        response: OTP_VERIFY_FAILURE,
        setCookieHeaders,
      }
    }

    const roleCode = await resolveRoleCode({
      role: (sessionResult.user as { role?: unknown }).role,
      roleId: (sessionResult.user as { roleId?: unknown }).roleId,
    })

    const redirectTo = mapRoleToRedirect(roleCode)

    await writeOtpAuthAuditLog({
      eventType: "SESSION_CREATED",
      eventStatus: "SUCCESS",
      requestId,
      providerId: "better-auth-phone-plugin",
      phoneMasked,
      ipAddress: requestHeaders?.get("x-forwarded-for") ?? undefined,
      userAgent: requestHeaders?.get("user-agent") ?? undefined,
      metadata: {
        sessionId: sessionResult.session.id,
        redirectTo,
      },
    })

    return {
      response: {
        ok: true,
        redirectTo,
      },
      setCookieHeaders,
    }
  } catch (error) {
    const failureReason = normalizeFailureReason(error)

    await writeOtpAuthAuditLog({
      eventType: "OTP_VERIFY_FAILED",
      eventStatus: "FAILED",
      requestId,
      providerId: "better-auth-phone-plugin",
      phoneMasked,
      ipAddress: requestHeaders?.get("x-forwarded-for") ?? undefined,
      userAgent: requestHeaders?.get("user-agent") ?? undefined,
      failureReason,
    })

    if (isMaxAttemptsError(error)) {
      await writeOtpAuthAuditLog({
        eventType: "OTP_MAX_ATTEMPTS_LOCKED",
        eventStatus: "FAILED",
        requestId,
        providerId: "better-auth-phone-plugin",
        phoneMasked,
        ipAddress: requestHeaders?.get("x-forwarded-for") ?? undefined,
        userAgent: requestHeaders?.get("user-agent") ?? undefined,
        failureReason,
      })
    }

    return {
      response: OTP_VERIFY_FAILURE,
      setCookieHeaders: [],
    }
  }
}
