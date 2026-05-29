import { NextResponse } from "next/server"

import { verifyOtpCode } from "@/lib/auth/otp/verify-service"
import type { OtpVerifyPayload, OtpVerifyResponse } from "@/lib/auth/otp/types"

const OTP_VERIFY_FAILURE: OtpVerifyResponse = {
  ok: false,
  message: "Invalid or expired code.",
}

function isOtpVerifyPayload(input: unknown): input is OtpVerifyPayload {
  if (!input || typeof input !== "object") {
    return false
  }

  const candidate = input as {
    phoneNumber?: unknown
    code?: unknown
  }

  return typeof candidate.phoneNumber === "string" && typeof candidate.code === "string"
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown
    if (!isOtpVerifyPayload(body)) {
      return NextResponse.json(OTP_VERIFY_FAILURE)
    }

    const verifyResult = await verifyOtpCode(body, request.headers)
    const response = NextResponse.json(verifyResult.response)

    for (const setCookie of verifyResult.setCookieHeaders) {
      response.headers.append("set-cookie", setCookie)
    }

    return response
  } catch {
    return NextResponse.json(OTP_VERIFY_FAILURE)
  }
}
