"use client"

import type {
  OtpRequestPayload,
  OtpRequestResponse,
  OtpVerifyPayload,
  OtpVerifyResponse,
} from "@/lib/auth/otp/types"

const OTP_REQUEST_FAILURE: OtpRequestResponse = {
  ok: false,
  message: "Unable to send code. Please try again later.",
}

const OTP_VERIFY_FAILURE: OtpVerifyResponse = {
  ok: false,
  message: "Invalid or expired code.",
}

export async function requestOtpCodeClient(payload: OtpRequestPayload): Promise<OtpRequestResponse> {
  try {
    const response = await fetch("/api/auth/otp/request", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    const data = (await response.json()) as OtpRequestResponse
    return data
  } catch {
    return OTP_REQUEST_FAILURE
  }
}

export async function verifyOtpCodeClient(
  payload: OtpVerifyPayload,
  requestId?: string,
): Promise<OtpVerifyResponse> {
  try {
    const headers: Record<string, string> = {
      "content-type": "application/json",
    }

    if (requestId) {
      headers["x-otp-request-id"] = requestId
    }

    const response = await fetch("/api/auth/otp/verify", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    })

    const data = (await response.json()) as OtpVerifyResponse
    return data
  } catch {
    return OTP_VERIFY_FAILURE
  }
}