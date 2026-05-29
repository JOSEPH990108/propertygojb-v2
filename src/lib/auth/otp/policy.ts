import type { OtpRuntimeEnv } from "@/lib/auth/otp/types"

export const OTP_CODE_LENGTH = 6
export const OTP_TTL_SECONDS = 5 * 60
export const OTP_MAX_ATTEMPTS = 5
export const OTP_RESEND_COOLDOWN_SECONDS = 60

export const OTP_REQUEST_RATE_LIMIT_MAX_PER_PHONE = 3
export const OTP_REQUEST_RATE_LIMIT_MAX_PER_IP = 10
export const OTP_REQUEST_RATE_LIMIT_WINDOW_SECONDS = 15 * 60

export const OTP_VERIFY_MAX_ATTEMPTS_PER_CHALLENGE = OTP_MAX_ATTEMPTS

export const OTP_POLICY = {
  codeLength: OTP_CODE_LENGTH,
  ttlSeconds: OTP_TTL_SECONDS,
  maxAttempts: OTP_MAX_ATTEMPTS,
  resendCooldownSeconds: OTP_RESEND_COOLDOWN_SECONDS,
  requestRateLimit: {
    maxPerPhone: OTP_REQUEST_RATE_LIMIT_MAX_PER_PHONE,
    maxPerIp: OTP_REQUEST_RATE_LIMIT_MAX_PER_IP,
    windowSeconds: OTP_REQUEST_RATE_LIMIT_WINDOW_SECONDS,
  },
  verifyMaxAttemptsPerChallenge: OTP_VERIFY_MAX_ATTEMPTS_PER_CHALLENGE,
} as const

export function isDevelopmentOtpRuntime(runtimeEnv: OtpRuntimeEnv): boolean {
  return runtimeEnv.toLowerCase() === "development"
}

export function readOtpRuntimeEnv(): OtpRuntimeEnv {
  return (process.env.APP_ENV ?? process.env.NODE_ENV ?? "development") as OtpRuntimeEnv
}
