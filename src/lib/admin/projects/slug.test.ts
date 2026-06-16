import { describe, expect, it } from "vitest"

import { createProjectSlug, normalizeSlug } from "@/lib/admin/projects/slug"

describe("normalizeSlug", () => {
  it("normalizes mixed casing and separators", () => {
    expect(normalizeSlug("  My Project -- Name  ")).toBe("my-project-name")
  })

  it("removes unsupported characters", () => {
    expect(normalizeSlug("A&B/C")).toBe("a-b-c")
  })
})

describe("createProjectSlug", () => {
  it("falls back to project for empty values", () => {
    expect(createProjectSlug("   ")).toBe("project")
  })
})
