import { describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))

import {
  evaluateRoleChange,
  resolveAssignableRolesForTarget,
  resolveRoleChangePermissionPreview,
} from "@/lib/admin/users/role-policy"

describe("resolveAssignableRolesForTarget", () => {
  it("returns ADMIN matrix targets for CUSTOMER and AGENT", () => {
    expect(
      resolveAssignableRolesForTarget({
        actorRole: "ADMIN",
        previousRole: "CUSTOMER",
      }),
    ).toEqual(["AGENT"])

    expect(
      resolveAssignableRolesForTarget({
        actorRole: "ADMIN",
        previousRole: "AGENT",
      }),
    ).toEqual(["CUSTOMER"])

    expect(
      resolveAssignableRolesForTarget({
        actorRole: "ADMIN",
        previousRole: "ADMIN",
      }),
    ).toEqual([])
  })

  it("returns SUPER_ADMIN matrix targets for mutable roles", () => {
    expect(
      resolveAssignableRolesForTarget({
        actorRole: "SUPER_ADMIN",
        previousRole: "CUSTOMER",
      }),
    ).toEqual(["AGENT", "ADMIN"])

    expect(
      resolveAssignableRolesForTarget({
        actorRole: "SUPER_ADMIN",
        previousRole: "AGENT",
      }),
    ).toEqual(["CUSTOMER", "ADMIN"])

    expect(
      resolveAssignableRolesForTarget({
        actorRole: "SUPER_ADMIN",
        previousRole: "ADMIN",
      }),
    ).toEqual(["CUSTOMER", "AGENT"])
  })
})

describe("resolveRoleChangePermissionPreview", () => {
  it("blocks self-target role change", () => {
    const result = resolveRoleChangePermissionPreview({
      actorRole: "ADMIN",
      previousRole: "CUSTOMER",
      actorUserId: "actor-1",
      targetUserId: "actor-1",
    })

    expect(result.canChange).toBe(false)
    expect(result.code).toBe("SELF_ROLE_CHANGE_BLOCKED")
  })

  it("blocks SUPER_ADMIN target and missing previous role", () => {
    expect(
      resolveRoleChangePermissionPreview({
        actorRole: "SUPER_ADMIN",
        previousRole: "SUPER_ADMIN",
      }),
    ).toMatchObject({
      canChange: false,
      code: "SUPER_ADMIN_TARGET_BLOCKED",
    })

    expect(
      resolveRoleChangePermissionPreview({
        actorRole: "SUPER_ADMIN",
        previousRole: null,
      }),
    ).toMatchObject({
      canChange: false,
      code: "ROLE_CHANGE_NOT_ALLOWED",
    })
  })

  it("returns assignable roles for allowed matrix cases", () => {
    expect(
      resolveRoleChangePermissionPreview({
        actorRole: "ADMIN",
        previousRole: "CUSTOMER",
      }),
    ).toMatchObject({
      canChange: true,
      assignableRoles: ["AGENT"],
    })

    expect(
      resolveRoleChangePermissionPreview({
        actorRole: "SUPER_ADMIN",
        previousRole: "ADMIN",
      }),
    ).toMatchObject({
      canChange: true,
      assignableRoles: ["CUSTOMER", "AGENT"],
    })
  })
})

describe("evaluateRoleChange", () => {
  it("blocks no-op transitions", () => {
    const result = evaluateRoleChange({
      actorRole: "SUPER_ADMIN",
      previousRole: "CUSTOMER",
      targetRole: "CUSTOMER",
    })

    expect(result).toMatchObject({
      allowed: false,
      code: "ROLE_CHANGE_NOT_ALLOWED",
    })
  })

  it("enforces ADMIN deny rules", () => {
    expect(
      evaluateRoleChange({
        actorRole: "ADMIN",
        previousRole: "CUSTOMER",
        targetRole: "ADMIN",
      }),
    ).toMatchObject({
      allowed: false,
      code: "ROLE_CHANGE_NOT_ALLOWED",
    })

    expect(
      evaluateRoleChange({
        actorRole: "ADMIN",
        previousRole: "ADMIN",
        targetRole: "CUSTOMER",
      }),
    ).toMatchObject({
      allowed: false,
      code: "ROLE_CHANGE_NOT_ALLOWED",
    })
  })

  it("allows matrix-approved transitions", () => {
    expect(
      evaluateRoleChange({
        actorRole: "ADMIN",
        previousRole: "CUSTOMER",
        targetRole: "AGENT",
      }),
    ).toEqual({
      allowed: true,
    })

    expect(
      evaluateRoleChange({
        actorRole: "SUPER_ADMIN",
        previousRole: "AGENT",
        targetRole: "ADMIN",
      }),
    ).toEqual({
      allowed: true,
    })
  })
})