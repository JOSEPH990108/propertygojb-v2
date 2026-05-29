export const OTP_PURPOSES = ["LOGIN", "REGISTER"] as const
export type OtpPurpose = (typeof OTP_PURPOSES)[number]

export const OTP_CHANNELS = ["SMS", "WHATSAPP", "DEV_CONSOLE"] as const
export type OtpChannel = (typeof OTP_CHANNELS)[number]

export type OtpRuntimeEnv = "development" | "production" | "test" | (string & {})

export type OtpProviderSendInput = {
  requestId: string
  identifier: string
  phoneE164: string
  channel: OtpChannel
  otpCode: string
  ttlSeconds: number
  purpose: OtpPurpose
  metadata?: Record<string, unknown>
}

export type OtpProviderSendResult = {
  delivered: boolean
  providerName: string
  providerMessageId?: string
  failureReason?: string
}

export type OtpProvider = {
  providerName: string
  supportedChannels: readonly OtpChannel[]
  environmentGuard: (runtimeEnv: OtpRuntimeEnv) => void
  sendOtp: (input: OtpProviderSendInput) => Promise<OtpProviderSendResult>
}

export type OtpErrorCode =
  | "OTP_INVALID_INPUT"
  | "OTP_INVALID_PHONE"
  | "OTP_PROVIDER_UNAVAILABLE"
  | "OTP_PROVIDER_ENV_BLOCKED"
  | "OTP_HASH_CONFIG_MISSING"

export type OtpSafeError = {
  ok: false
  code: OtpErrorCode
  message: string
}

export type OtpSafeSuccess<T> = {
  ok: true
  data: T
}

export type OtpSafeResult<T> = OtpSafeSuccess<T> | OtpSafeError

export type OtpRequestPurpose = OtpPurpose

export type OtpRequestPayload = {
  phoneNumber: string
  purpose: OtpRequestPurpose
  channelPreference?: OtpChannel
}

export type OtpRequestSuccessResponse = {
  ok: true
  identifier: string
  resendAvailableAt: string
}

export type OtpRequestFailureResponse = {
  ok: false
  message: string
}

export type OtpRequestResponse = OtpRequestSuccessResponse | OtpRequestFailureResponse

export type OtpRequestContext = {
  ipAddress?: string
  userAgent?: string
}

export type OtpRateLimitStatus = {
  allowed: boolean
  phoneCount: number
  ipCount: number
  maxPerPhone: number
  maxPerIp: number
  blockedReason?: "PHONE_LIMIT" | "IP_LIMIT"
}

export type OtpAuthAuditEventType =
  | "OTP_REQUESTED"
  | "OTP_SENT"
  | "OTP_DELIVERY_FAILED"
  | "OTP_RESEND_BLOCKED"
