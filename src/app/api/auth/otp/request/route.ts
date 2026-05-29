import { NextResponse } from "next/server"

import { requestOtpCode } from "@/lib/auth/otp/service"
import type { OtpRequestPayload, OtpRequestResponse } from "@/lib/auth/otp/types"

const OTP_REQUEST_FAILURE: OtpRequestResponse = {
  ok: false,
  message: "Unable to send code. Please try again later.",
}

function isOtpRequestPayload(input: unknown): input is OtpRequestPayload {
  if (!input || typeof input !== "object") {
    return false
  }

  const candidate = input as {
    phoneNumber?: unknown
    purpose?: unknown
  }

  return (
    typeof candidate.phoneNumber === "string" &&
    typeof candidate.purpose === "string" &&
    (candidate.purpose === "LOGIN" || candidate.purpose === "REGISTER")
  )
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown
    if (!isOtpRequestPayload(body)) {
      return NextResponse.json(OTP_REQUEST_FAILURE)
    }

    const response = await requestOtpCode(body, request.headers)
    return NextResponse.json(response)
  } catch {
    return NextResponse.json(OTP_REQUEST_FAILURE)
  }
}
