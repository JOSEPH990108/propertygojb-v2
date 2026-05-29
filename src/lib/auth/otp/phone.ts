import type { OtpSafeResult } from "@/lib/auth/otp/types"

const E164_REGEX = /^\+[1-9]\d{7,14}$/
const DIGITS_ONLY_REGEX = /^\d+$/
const MALAYSIA_COUNTRY_CODE = "60"

type NormalizePhoneOptions = {
  defaultCountry?: "MY"
}

export function maskPhone(phoneE164: string): string {
  if (!phoneE164.startsWith("+") || phoneE164.length < 7) {
    return "***"
  }

  return `${phoneE164.slice(0, 3)}****${phoneE164.slice(-2)}`
}

export function normalizePhoneToE164(
  input: string,
  options: NormalizePhoneOptions = { defaultCountry: "MY" },
): OtpSafeResult<{ phoneE164: string; phoneNormalized: string }> {
  const normalizedInput = input.trim()
  if (!normalizedInput) {
    return {
      ok: false,
      code: "OTP_INVALID_PHONE",
      message: "Invalid phone number.",
    }
  }

  const cleaned = normalizedInput.replace(/[\s\-().]/g, "")

  if (cleaned.startsWith("+")) {
    if (!E164_REGEX.test(cleaned)) {
      return {
        ok: false,
        code: "OTP_INVALID_PHONE",
        message: "Invalid phone number.",
      }
    }

    return {
      ok: true,
      data: {
        phoneE164: cleaned,
        phoneNormalized: cleaned,
      },
    }
  }

  const digits = cleaned.startsWith("00") ? cleaned.slice(2) : cleaned
  if (!DIGITS_ONLY_REGEX.test(digits)) {
    return {
      ok: false,
      code: "OTP_INVALID_PHONE",
      message: "Invalid phone number.",
    }
  }

  const wantsMalaysiaDefault = (options.defaultCountry ?? "MY") === "MY"
  let resolved = ""

  if (digits.startsWith(MALAYSIA_COUNTRY_CODE) && digits.length >= 9 && digits.length <= 12) {
    resolved = `+${digits}`
  } else if (wantsMalaysiaDefault && digits.startsWith("0") && digits.length >= 9 && digits.length <= 11) {
    resolved = `+${MALAYSIA_COUNTRY_CODE}${digits.slice(1)}`
  } else {
    return {
      ok: false,
      code: "OTP_INVALID_PHONE",
      message: "Invalid phone number.",
    }
  }

  if (!E164_REGEX.test(resolved)) {
    return {
      ok: false,
      code: "OTP_INVALID_PHONE",
      message: "Invalid phone number.",
    }
  }

  return {
    ok: true,
    data: {
      phoneE164: resolved,
      phoneNormalized: resolved,
    },
  }
}
