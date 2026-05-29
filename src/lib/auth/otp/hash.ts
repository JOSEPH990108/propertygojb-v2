import "server-only"

import { createHmac, timingSafeEqual } from "crypto"

import { OTP_CODE_LENGTH } from "@/lib/auth/otp/policy"

type OtpHashInput = {
  otpCode: string
  identifier: string
}

function assertOtpCodeFormat(otpCode: string): void {
  const otpPattern = new RegExp(`^\\d{${OTP_CODE_LENGTH}}$`)
  if (!otpPattern.test(otpCode)) {
    throw new Error(`OTP code must be exactly ${OTP_CODE_LENGTH} digits.`)
  }
}

function getOtpHashSecret(): string {
  const secret = process.env.OTP_HASH_SECRET ?? process.env.BETTER_AUTH_SECRET ?? process.env.AUTH_SECRET
  if (!secret) {
    throw new Error("OTP hash secret is missing. Set OTP_HASH_SECRET or BETTER_AUTH_SECRET.")
  }

  return secret
}

function buildOtpHashPayload(input: OtpHashInput): string {
  return `${input.identifier}:${input.otpCode}`
}

export function hashOtpCode(input: OtpHashInput): string {
  assertOtpCodeFormat(input.otpCode)

  return createHmac("sha256", getOtpHashSecret())
    .update(buildOtpHashPayload(input))
    .digest("hex")
}

export function verifyOtpCode(input: OtpHashInput & { otpHash: string }): boolean {
  if (!input.otpHash || typeof input.otpHash !== "string") {
    return false
  }

  try {
    const computedHash = hashOtpCode(input)
    const providedHashBuffer = Buffer.from(input.otpHash, "hex")
    const computedHashBuffer = Buffer.from(computedHash, "hex")

    if (providedHashBuffer.length !== computedHashBuffer.length) {
      return false
    }

    return timingSafeEqual(providedHashBuffer, computedHashBuffer)
  } catch {
    return false
  }
}
