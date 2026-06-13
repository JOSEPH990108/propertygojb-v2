import { beforeEach, describe, expect, it, vi } from "vitest"

import { ROUTES } from "@/config/routes"

const {
  redirectMock,
  headersMock,
  getSessionMock,
  userFindFirstMock,
  roleFindFirstMock,
} = vi.hoisted(() => ({
  redirectMock: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`)
  }),
  headersMock: vi.fn(async () => new Headers()),
  getSessionMock: vi.fn(),
  userFindFirstMock: vi.fn(),
  roleFindFirstMock: vi.fn(),
}))

vi.mock("server-only", () => ({}))

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}))

vi.mock("next/headers", () => ({
  headers: headersMock,
}))

vi.mock("@/lib/auth/server", () => ({
  auth: {
    api: {
      getSession: getSessionMock,
    },
  },
}))

vi.mock("@/db", () => ({
  db: {
    query: {
      user: {
        findFirst: userFindFirstMock,
      },
      roles: {
        findFirst: roleFindFirstMock,
      },
    },
  },
}))

import {
  getLoginRedirectPath,
  getRoleHomePath,
  redirectAuthenticatedUserByRole,
  requireAuth,
  requireRole,
} from "@/lib/auth/guards"

function mockAuthenticatedUser(roleCode: unknown) {
  getSessionMock.mockResolvedValue({
    session: {
      id: "session-1",
    },
    user: {
      id: "user-1",
      email: "agent@example.com",
    },
  })

  userFindFirstMock.mockResolvedValue({
    roleId: "role-1",
  })

  roleFindFirstMock.mockResolvedValue({
    code: roleCode,
  })
}

describe("auth guards", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    getSessionMock.mockResolvedValue(null)
    userFindFirstMock.mockResolvedValue(null)
    roleFindFirstMock.mockResolvedValue(null)
  })

  describe("getRoleHomePath", () => {
    it("returns expected home paths by role", () => {
      expect(getRoleHomePath("CUSTOMER")).toBe(ROUTES.public.home)
      expect(getRoleHomePath("AGENT")).toBe(ROUTES.agent.dashboard)
      expect(getRoleHomePath("ADMIN")).toBe(ROUTES.admin.dashboard)
      expect(getRoleHomePath("SUPER_ADMIN")).toBe(ROUTES.admin.dashboard)
    })

    it("falls back to unknown-role login path when role is missing", () => {
      expect(getRoleHomePath(undefined)).toBe(ROUTES.auth.loginUnknownRoleError)
    })
  })

  describe("getLoginRedirectPath", () => {
    it("returns plain login path when next is not provided", () => {
      expect(getLoginRedirectPath()).toBe(ROUTES.auth.login)
      expect(getLoginRedirectPath("   ")).toBe(ROUTES.auth.login)
    })

    it("encodes safe internal next paths", () => {
      expect(getLoginRedirectPath("/admin/users")).toBe(`${ROUTES.auth.login}?next=%2Fadmin%2Fusers`)
    })

    it("rejects external or unsafe redirect targets", () => {
      expect(getLoginRedirectPath("https://example.com/evil")).toBe(ROUTES.auth.login)
      expect(getLoginRedirectPath("//example.com/evil")).toBe(ROUTES.auth.login)
      expect(getLoginRedirectPath("javascript:alert(1)")).toBe(ROUTES.auth.login)
    })
  })

  describe("requireRole", () => {
    it("redirects unauthenticated requests to login with safe next", async () => {
      await expect(requireRole(["ADMIN"], { nextPath: "/admin/users" })).rejects.toThrow(
        `REDIRECT:${ROUTES.auth.login}?next=%2Fadmin%2Fusers`,
      )
    })

    it("redirects when resolved role is unknown", async () => {
      mockAuthenticatedUser("manager")

      await expect(requireRole(["ADMIN"])).rejects.toThrow(`REDIRECT:${ROUTES.auth.loginUnknownRoleError}`)
    })

    it("redirects forbidden roles to their home path", async () => {
      mockAuthenticatedUser("AGENT")

      await expect(requireRole(["ADMIN"])).rejects.toThrow(`REDIRECT:${ROUTES.agent.dashboard}`)
    })

    it("returns context for allowed roles", async () => {
      mockAuthenticatedUser("ADMIN")

      const context = await requireRole(["ADMIN", "SUPER_ADMIN"])

      expect(context.isAuthenticated).toBe(true)
      expect(context.roleCode).toBe("ADMIN")
      expect(context.roleId).toBe("role-1")
      expect(getSessionMock).toHaveBeenCalledTimes(1)
    })
  })

  describe("requireAuth", () => {
    it("redirects unauthenticated users", async () => {
      await expect(requireAuth()).rejects.toThrow(`REDIRECT:${ROUTES.auth.login}`)
    })

    it("returns context when user is authenticated and role is valid", async () => {
      mockAuthenticatedUser("CUSTOMER")

      const context = await requireAuth()

      expect(context.isAuthenticated).toBe(true)
      expect(context.roleCode).toBe("CUSTOMER")
    })
  })

  describe("redirectAuthenticatedUserByRole", () => {
    it("returns null for unauthenticated users", async () => {
      await expect(redirectAuthenticatedUserByRole()).resolves.toBeNull()
    })

    it("redirects authenticated users to role home", async () => {
      mockAuthenticatedUser("AGENT")

      await expect(redirectAuthenticatedUserByRole()).rejects.toThrow(`REDIRECT:${ROUTES.agent.dashboard}`)
    })
  })
})