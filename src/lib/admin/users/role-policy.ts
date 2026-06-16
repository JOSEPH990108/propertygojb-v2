import "server-only"

export type AssignInternalRole = "CUSTOMER" | "AGENT" | "ADMIN"
export type AssignRoleCode = AssignInternalRole | "SUPER_ADMIN"
export type InternalActorRole = "ADMIN" | "SUPER_ADMIN"

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
  actorRole: InternalActorRole
  previousRole: AssignRoleCode
  targetRole: AssignInternalRole
}

type ResolveRoleChangePermissionInput = {
  actorRole: InternalActorRole
  previousRole: AssignRoleCode | null
  actorUserId?: string
  targetUserId?: string
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

export type RoleChangePermissionPreview = {
  canChange: boolean
  assignableRoles: readonly AssignInternalRole[]
  code?: RoleChangeFailureCode
  message?: string
}

function buildPermissionDenied(
  code: RoleChangeFailureCode,
  message: string,
): RoleChangePermissionPreview {
  return {
    canChange: false,
    assignableRoles: [],
    code,
    message,
  }
}

export function resolveAssignableRolesForTarget(input: {
  actorRole: InternalActorRole
  previousRole: AssignRoleCode
}): readonly AssignInternalRole[] {
  const { actorRole, previousRole } = input

  if (previousRole === "SUPER_ADMIN") {
    return []
  }

  if (actorRole === "ADMIN") {
    if (previousRole === "CUSTOMER") {
      return ["AGENT"]
    }

    if (previousRole === "AGENT") {
      return ["CUSTOMER"]
    }

    return []
  }

  if (previousRole === "CUSTOMER") {
    return ["AGENT", "ADMIN"]
  }

  if (previousRole === "AGENT") {
    return ["CUSTOMER", "ADMIN"]
  }

  if (previousRole === "ADMIN") {
    return ["CUSTOMER", "AGENT"]
  }

  return []
}

export function resolveRoleChangePermissionPreview(
  input: ResolveRoleChangePermissionInput,
): RoleChangePermissionPreview {
  const { actorRole, previousRole, actorUserId, targetUserId } = input

  if (actorUserId && targetUserId && actorUserId === targetUserId) {
    return buildPermissionDenied("SELF_ROLE_CHANGE_BLOCKED", "You cannot modify your own role.")
  }

  if (!previousRole) {
    return buildPermissionDenied(
      "ROLE_CHANGE_NOT_ALLOWED",
      "Current target role is not eligible for this action.",
    )
  }

  if (previousRole === "SUPER_ADMIN") {
    return buildPermissionDenied(
      "SUPER_ADMIN_TARGET_BLOCKED",
      "Changing a SUPER_ADMIN target is blocked in MVP.",
    )
  }

  const assignableRoles = resolveAssignableRolesForTarget({
    actorRole,
    previousRole,
  })

  if (assignableRoles.length === 0) {
    if (actorRole === "ADMIN") {
      return buildPermissionDenied("ROLE_CHANGE_NOT_ALLOWED", "ADMIN cannot modify ADMIN users.")
    }

    return buildPermissionDenied("ROLE_CHANGE_NOT_ALLOWED", "This role change is not allowed.")
  }

  return {
    canChange: true,
    assignableRoles,
  }
}

export function evaluateRoleChange(input: EvaluateRoleChangeInput): EvaluateRoleChangeResult {
  const { actorRole, previousRole, targetRole } = input

  if (previousRole === targetRole) {
    return {
      allowed: false,
      code: "ROLE_CHANGE_NOT_ALLOWED",
      message: "No role change detected.",
    }
  }

  const permission = resolveRoleChangePermissionPreview({
    actorRole,
    previousRole,
  })

  if (!permission.canChange) {
    return {
      allowed: false,
      code: permission.code ?? "ROLE_CHANGE_NOT_ALLOWED",
      message: permission.message ?? "This role change is not allowed.",
    }
  }

  if (!permission.assignableRoles.includes(targetRole)) {
    return {
      allowed: false,
      code: "ROLE_CHANGE_NOT_ALLOWED",
      message: `This role change is not allowed for ${actorRole}.`,
    }
  }

  return {
    allowed: true,
  }
}
