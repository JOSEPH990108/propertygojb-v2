import { describe, expect, it } from "vitest"

import {
  canTransitionBookingStatus,
  getNextBookingStatuses,
  isBookingStatusAllowedForRole,
  normalizeBookingStatus,
  resolveNextBookingStatus,
  resolveNextBookingStatusForRole,
} from "@/lib/internal/bookings/transitions"

describe("booking transitions", () => {
  it("allows valid transitions and rejects invalid ones", () => {
    expect(canTransitionBookingStatus("DRAFT", "SUBMITTED")).toBe(true)
    expect(canTransitionBookingStatus("DRAFT", "APPROVED")).toBe(false)
    expect(canTransitionBookingStatus("APPROVED", "CANCELLED")).toBe(true)
    expect(canTransitionBookingStatus("APPROVED", "APPROVED")).toBe(false)
  })

  it("returns deterministic next transition candidates", () => {
    expect(resolveNextBookingStatus("DRAFT")).toBe("SUBMITTED")
    expect(resolveNextBookingStatus("CANCELLED")).toBeNull()
    expect(getNextBookingStatuses("UNDER_REVIEW")).toEqual([
      "PAYMENT_PENDING",
      "DOCS_PENDING",
      "REJECTED",
      "CANCELLED",
    ])
  })

  it("applies role-aware next transition policy", () => {
    expect(resolveNextBookingStatusForRole("ADMIN", "UNDER_REVIEW")).toBe("PAYMENT_PENDING")
    expect(resolveNextBookingStatusForRole("AGENT", "UNDER_REVIEW")).toBe("PAYMENT_PENDING")
    expect(resolveNextBookingStatusForRole("AGENT", "PAYMENT_VERIFIED")).toBe("DOCS_PENDING")
    expect(resolveNextBookingStatusForRole("AGENT", "DOCS_VERIFIED")).toBe("CANCELLED")
  })

  it("validates booking status values", () => {
    expect(normalizeBookingStatus("draft")).toBe("DRAFT")
    expect(normalizeBookingStatus("   submitted  ")).toBe("SUBMITTED")
    expect(normalizeBookingStatus("not-a-status")).toBeNull()
    expect(normalizeBookingStatus(10)).toBeNull()
  })

  it("exposes role policy lookups", () => {
    expect(isBookingStatusAllowedForRole("ADMIN", "APPROVED")).toBe(true)
    expect(isBookingStatusAllowedForRole("AGENT", "APPROVED")).toBe(false)
  })
})
