import "server-only"

export type AssignInternalRole = "CUSTOMER" | "AGENT" | "ADMIN"
export type AssignRoleCode = AssignInternalRole | "SUPER_ADMIN"

export type RoleChangeFailureCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "TARGET_NOT_FOUND"
  | "INVALID_ROLE"
  | "REASON_REQUIRED"
  | "SELF_ROLE_CHANGE_BLOCKED"
  | "SUPER_ADMIN_ASSIGNMENT_BLOCKED"
  | "SUPER_ADMIN_TARGET_BLOCKED"
  | "ROLE_CHANGE_NOT_ALLOWED"

type EvaluateRoleChangeInput = {
  actorRole: "ADMIN" | "SUPER_ADMIN"
  previousRole: AssignRoleCode
  targetRole: AssignInternalRole
}

type AllowedRoleChange = {
  allowed: true
}

type DeniedRoleChange = {
  allowed: false
  code: RoleChangeFailureCode
  message: string
}

export type EvaluateRoleChangeResult = AllowedRoleChange | DeniedRoleChange

export function evaluateRoleChange(input: EvaluateRoleChangeInput): EvaluateRoleChangeResult {
  const { actorRole, previousRole, targetRole } = input

  if (previousRole === targetRole) {
    return {
      allowed: false,
      code: "ROLE_CHANGE_NOT_ALLOWED",
      message: "No role change detected.",
    }
  }

  if (previousRole === "SUPER_ADMIN") {
    return {
      allowed: false,
      code: "SUPER_ADMIN_TARGET_BLOCKED",
      message: "Changing a SUPER_ADMIN target is blocked in MVP.",
    }
  }

  if (actorRole === "ADMIN") {
    if (previousRole === "ADMIN") {
      return {
        allowed: false,
        code: "ROLE_CHANGE_NOT_ALLOWED",
        message: "ADMIN cannot modify ADMIN users.",
      }
    }

    if (previousRole === "CUSTOMER" && targetRole === "AGENT") {
      return {
        allowed: true,
      }
    }

    if (targetRole === "CUSTOMER" && previousRole === "AGENT") {
      return {
        allowed: true,
      }
    }

    return {
      allowed: false,
      code: "ROLE_CHANGE_NOT_ALLOWED",
      message: "This role change is not allowed for ADMIN.",
    }
  }

  if (targetRole === "ADMIN" || targetRole === "AGENT" || targetRole === "CUSTOMER") {
    return {
      allowed: true,
    }
  }

  return {
    allowed: false,
    code: "ROLE_CHANGE_NOT_ALLOWED",
    message: "This role change is not allowed.",
  }
}
