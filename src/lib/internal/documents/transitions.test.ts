import { describe, expect, it } from "vitest"

import {
  canTransitionDocumentRequestStatus,
  getNextDocumentRequestStatuses,
  isDocumentRequestStatusAllowedForRole,
  normalizeDocumentRequestStatus,
  resolveNextDocumentRequestStatus,
  resolveNextDocumentRequestStatusForRole,
} from "@/lib/internal/documents/transitions"

describe("document request transitions", () => {
  it("allows valid transitions and rejects invalid transitions", () => {
    expect(canTransitionDocumentRequestStatus("REQUESTED", "SUBMITTED")).toBe(true)
    expect(canTransitionDocumentRequestStatus("REQUESTED", "VERIFIED")).toBe(false)
    expect(canTransitionDocumentRequestStatus("VERIFIED", "REQUESTED")).toBe(true)
    expect(canTransitionDocumentRequestStatus("VERIFIED", "VERIFIED")).toBe(false)
  })

  it("returns deterministic next transition candidates", () => {
    expect(resolveNextDocumentRequestStatus("REQUESTED")).toBe("SUBMITTED")
    expect(resolveNextDocumentRequestStatus("WAIVED")).toBe("REQUESTED")
    expect(getNextDocumentRequestStatuses("SUBMITTED")).toEqual(["VERIFIED", "REJECTED"])
  })

  it("applies role-aware next transition policy", () => {
    expect(resolveNextDocumentRequestStatusForRole("ADMIN", "SUBMITTED")).toBe("VERIFIED")
    expect(resolveNextDocumentRequestStatusForRole("AGENT", "SUBMITTED")).toBeNull()
    expect(resolveNextDocumentRequestStatusForRole("AGENT", "REJECTED")).toBe("SUBMITTED")
  })

  it("validates document request status values", () => {
    expect(normalizeDocumentRequestStatus("requested")).toBe("REQUESTED")
    expect(normalizeDocumentRequestStatus("  waived")).toBe("WAIVED")
    expect(normalizeDocumentRequestStatus("done")).toBeNull()
    expect(normalizeDocumentRequestStatus(false)).toBeNull()
  })

  it("exposes role policy lookups", () => {
    expect(isDocumentRequestStatusAllowedForRole("ADMIN", "VERIFIED")).toBe(true)
    expect(isDocumentRequestStatusAllowedForRole("AGENT", "VERIFIED")).toBe(false)
  })
})
