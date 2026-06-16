import type { OtpSafeResult } from "@/lib/auth/otp/types"

const E164_REGEX = /^\+[1-9]\d{7,14}$/

export type SupportedPhoneCountryCode =
  | "MY"
  | "SG"
  | "ID"
  | "TH"
  | "PH"
  | "VN"
  | "IN"
  | "CN"
  | "HK"
  | "TW"
  | "JP"
  | "KR"
  | "AU"
  | "NZ"
  | "GB"
  | "US"
  | "CA"

export type PhoneCountry = {
  code: SupportedPhoneCountryCode
  name: string
  dialCode: string
  flag: string
  minNationalLength: number
  maxNationalLength: number
  trimsLeadingZero: boolean
  exampleNational: string
}

const PHONE_COUNTRIES: readonly PhoneCountry[] = [
  {
    code: "MY",
    name: "Malaysia",
    dialCode: "60",
    flag: "🇲🇾",
    minNationalLength: 9,
    maxNationalLength: 10,
    trimsLeadingZero: true,
    exampleNational: "1128758216",
  },
  {
    code: "SG",
    name: "Singapore",
    dialCode: "65",
    flag: "🇸🇬",
    minNationalLength: 8,
    maxNationalLength: 8,
    trimsLeadingZero: false,
    exampleNational: "81234567",
  },
  {
    code: "ID",
    name: "Indonesia",
    dialCode: "62",
    flag: "🇮🇩",
    minNationalLength: 9,
    maxNationalLength: 13,
    trimsLeadingZero: true,
    exampleNational: "81234567890",
  },
  {
    code: "TH",
    name: "Thailand",
    dialCode: "66",
    flag: "🇹🇭",
    minNationalLength: 8,
    maxNationalLength: 9,
    trimsLeadingZero: true,
    exampleNational: "812345678",
  },
  {
    code: "PH",
    name: "Philippines",
    dialCode: "63",
    flag: "🇵🇭",
    minNationalLength: 10,
    maxNationalLength: 10,
    trimsLeadingZero: true,
    exampleNational: "9123456789",
  },
  {
    code: "VN",
    name: "Vietnam",
    dialCode: "84",
    flag: "🇻🇳",
    minNationalLength: 9,
    maxNationalLength: 10,
    trimsLeadingZero: true,
    exampleNational: "912345678",
  },
  {
    code: "IN",
    name: "India",
    dialCode: "91",
    flag: "🇮🇳",
    minNationalLength: 10,
    maxNationalLength: 10,
    trimsLeadingZero: true,
    exampleNational: "9876543210",
  },
  {
    code: "CN",
    name: "China",
    dialCode: "86",
    flag: "🇨🇳",
    minNationalLength: 11,
    maxNationalLength: 11,
    trimsLeadingZero: false,
    exampleNational: "13800138000",
  },
  {
    code: "HK",
    name: "Hong Kong",
    dialCode: "852",
    flag: "🇭🇰",
    minNationalLength: 8,
    maxNationalLength: 8,
    trimsLeadingZero: false,
    exampleNational: "51234567",
  },
  {
    code: "TW",
    name: "Taiwan",
    dialCode: "886",
    flag: "🇹🇼",
    minNationalLength: 9,
    maxNationalLength: 9,
    trimsLeadingZero: true,
    exampleNational: "912345678",
  },
  {
    code: "JP",
    name: "Japan",
    dialCode: "81",
    flag: "🇯🇵",
    minNationalLength: 10,
    maxNationalLength: 10,
    trimsLeadingZero: true,
    exampleNational: "9012345678",
  },
  {
    code: "KR",
    name: "South Korea",
    dialCode: "82",
    flag: "🇰🇷",
    minNationalLength: 9,
    maxNationalLength: 10,
    trimsLeadingZero: true,
    exampleNational: "1012345678",
  },
  {
    code: "AU",
    name: "Australia",
    dialCode: "61",
    flag: "🇦🇺",
    minNationalLength: 9,
    maxNationalLength: 9,
    trimsLeadingZero: true,
    exampleNational: "412345678",
  },
  {
    code: "NZ",
    name: "New Zealand",
    dialCode: "64",
    flag: "🇳🇿",
    minNationalLength: 8,
    maxNationalLength: 10,
    trimsLeadingZero: true,
    exampleNational: "211234567",
  },
  {
    code: "GB",
    name: "United Kingdom",
    dialCode: "44",
    flag: "🇬🇧",
    minNationalLength: 9,
    maxNationalLength: 10,
    trimsLeadingZero: true,
    exampleNational: "7400123456",
  },
  {
    code: "US",
    name: "United States",
    dialCode: "1",
    flag: "🇺🇸",
    minNationalLength: 10,
    maxNationalLength: 10,
    trimsLeadingZero: false,
    exampleNational: "2015550123",
  },
  {
    code: "CA",
    name: "Canada",
    dialCode: "1",
    flag: "🇨🇦",
    minNationalLength: 10,
    maxNationalLength: 10,
    trimsLeadingZero: false,
    exampleNational: "4165550123",
  },
] as const

type NormalizePhoneOptions = {
  defaultCountry?: SupportedPhoneCountryCode
}

export function maskPhone(phoneE164: string): string {
  if (!phoneE164.startsWith("+") || phoneE164.length < 7) {
    return "***"
  }

  return `${phoneE164.slice(0, 3)}****${phoneE164.slice(-2)}`
}

export function getPhoneCountries(): readonly PhoneCountry[] {
  return PHONE_COUNTRIES
}

export function getPhoneCountryByCode(countryCode: string): PhoneCountry | undefined {
  const normalized = countryCode.toUpperCase()
  return PHONE_COUNTRIES.find((country) => country.code === normalized)
}

function findCountryByE164(input: string): PhoneCountry | undefined {
  const digits = input.slice(1)

  return [...PHONE_COUNTRIES]
    .sort((left, right) => right.dialCode.length - left.dialCode.length)
    .find((country) => digits.startsWith(country.dialCode))
}

function sanitizeNationalNumber(input: string): string {
  return input.replace(/\D/g, "")
}

function normalizeNationalNumber(country: PhoneCountry, rawValue: string): string {
  const digits = sanitizeNationalNumber(rawValue)
  if (country.trimsLeadingZero) {
    return digits.replace(/^0+/, "")
  }

  return digits
}

function hasValidNationalLength(country: PhoneCountry, nationalNumber: string): boolean {
  return (
    nationalNumber.length >= country.minNationalLength &&
    nationalNumber.length <= country.maxNationalLength
  )
}

export function splitE164Phone(input: string):
  | {
      country: PhoneCountry
      nationalNumber: string
      phoneE164: string
    }
  | undefined {
  const cleaned = input.trim().replace(/[\s\-().]/g, "")
  if (!E164_REGEX.test(cleaned)) {
    return undefined
  }

  const country = findCountryByE164(cleaned)
  if (!country) {
    return undefined
  }

  const nationalNumber = cleaned.slice(1 + country.dialCode.length)
  return {
    country,
    nationalNumber,
    phoneE164: cleaned,
  }
}

export function buildE164PhoneFromCountry(
  countryCode: string,
  nationalNumberInput: string,
): OtpSafeResult<{ phoneE164: string; phoneNormalized: string }> {
  const country = getPhoneCountryByCode(countryCode)
  if (!country) {
    return {
      ok: false,
      code: "OTP_INVALID_PHONE",
      message: "Invalid phone number.",
    }
  }

  const nationalNumber = normalizeNationalNumber(country, nationalNumberInput)
  if (!nationalNumber || !hasValidNationalLength(country, nationalNumber)) {
    return {
      ok: false,
      code: "OTP_INVALID_PHONE",
      message: "Invalid phone number.",
    }
  }

  const phoneE164 = `+${country.dialCode}${nationalNumber}`
  if (!E164_REGEX.test(phoneE164)) {
    return {
      ok: false,
      code: "OTP_INVALID_PHONE",
      message: "Invalid phone number.",
    }
  }

  return {
    ok: true,
    data: {
      phoneE164,
      phoneNormalized: phoneE164,
    },
  }
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

    const country = findCountryByE164(cleaned)
    if (!country) {
      return {
        ok: true,
        data: {
          phoneE164: cleaned,
          phoneNormalized: cleaned,
        },
      }
    }

    const nationalNumber = cleaned.slice(1 + country.dialCode.length)
    if (!hasValidNationalLength(country, nationalNumber)) {
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

  const defaultCountryCode = options.defaultCountry ?? "MY"
  const defaultCountry = getPhoneCountryByCode(defaultCountryCode)

  let nationalInput = cleaned.startsWith("00") ? cleaned.slice(2) : cleaned
  if (defaultCountry && nationalInput.startsWith(defaultCountry.dialCode)) {
    nationalInput = nationalInput.slice(defaultCountry.dialCode.length)
  }

  return buildE164PhoneFromCountry(defaultCountryCode, nationalInput)
}
