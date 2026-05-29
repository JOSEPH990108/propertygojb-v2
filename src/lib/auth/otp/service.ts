import "server-only"

import { randomUUID } from "crypto"

import { auth } from "@/lib/auth/server"
import { normalizePhoneToE164 } from "@/lib/auth/otp/phone"
import { OTP_RESEND_COOLDOWN_SECONDS } from "@/lib/auth/otp/policy"
import type {
  OtpPurpose,
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

function createChallengeIdentifier(): string {
  return randomUUID()
}

function toSuccessResponse(payload: { requestId: string; resendAvailableAt: Date }): OtpRequestSuccessResponse {
  return {
    ok: true,
    requestId: payload.requestId,
    resendAvailableAt: payload.resendAvailableAt.toISOString(),
  }
}

export async function requestOtpCode(
  payload: OtpRequestPayload,
  requestHeaders?: Headers,
): Promise<OtpRequestResponse> {
  if (!isOtpPurpose(payload.purpose)) {
    return OTP_REQUEST_FAILURE
  }

  const normalizedPhone = normalizePhoneToE164(payload.phoneNumber)
  if (!normalizedPhone.ok) {
    return OTP_REQUEST_FAILURE
  }

  const requestId = createChallengeIdentifier()
  const resendAvailableAt = new Date(Date.now() + OTP_RESEND_COOLDOWN_SECONDS * 1000)

  try {
    const pluginRequestHeaders = new Headers(requestHeaders ?? undefined)
    pluginRequestHeaders.set("x-otp-request-id", requestId)
    pluginRequestHeaders.set("x-otp-purpose", payload.purpose)

    await auth.api.sendPhoneNumberOTP({
      body: {
        phoneNumber: normalizedPhone.data.phoneE164,
      },
      headers: pluginRequestHeaders,
    })

    return toSuccessResponse({
      requestId,
      resendAvailableAt,
    })
  } catch {
    return OTP_REQUEST_FAILURE
  }
}
