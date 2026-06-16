import { describe, expect, it } from "vitest"

import {
  buildE164PhoneFromCountry,
  normalizePhoneToE164,
  splitE164Phone,
} from "@/lib/auth/otp/phone"

describe("normalizePhoneToE164", () => {
  it("normalizes MY local number with leading zero", () => {
    const result = normalizePhoneToE164("01128758216", {
      defaultCountry: "MY",
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.phoneE164).toBe("+601128758216")
    }
  })

  it("rejects clearly invalid short input", () => {
    const result = normalizePhoneToE164("123", {
      defaultCountry: "MY",
    })

    expect(result.ok).toBe(false)
  })
})

describe("buildE164PhoneFromCountry", () => {
  it("builds E164 for SG number", () => {
    const result = buildE164PhoneFromCountry("SG", "81234567")

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.phoneE164).toBe("+6581234567")
    }
  })
})

describe("splitE164Phone", () => {
  it("splits valid E164 input into country and national number", () => {
    const result = splitE164Phone("+6581234567")

    expect(result).toBeDefined()
    expect(result?.country.code).toBe("SG")
    expect(result?.nationalNumber).toBe("81234567")
  })
})
