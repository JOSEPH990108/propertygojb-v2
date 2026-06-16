import "server-only"

import { auditLogs } from "@/db/schema/audit"

import type { AssignInternalRole, AssignRoleCode } from "@/lib/admin/users/role-policy"

type RoleChangeAuditInput = {
  actorUserId: string
  actorRoleId?: string
  targetUserId: string
  previousRole: AssignRoleCode
  newRole: AssignInternalRole
  reasonNote: string
  requestId?: string
  traceId?: string
}

type TransactionClient = {
  insert: (table: typeof auditLogs) => {
    values: (value: typeof auditLogs.$inferInsert) => unknown
  }
}

function resolveActionType(previousRole: AssignRoleCode, newRole: AssignInternalRole): string {
  if (previousRole === "CUSTOMER" && (newRole === "AGENT" || newRole === "ADMIN")) {
    return "INTERNAL_USER_ROLE_ASSIGNED"
  }

  return "INTERNAL_USER_ROLE_CHANGED"
}

export async function writeInternalRoleChangeAudit(
  tx: TransactionClient,
  input: RoleChangeAuditInput,
): Promise<void> {
  const actionType = resolveActionType(input.previousRole, input.newRole)

  await Promise.resolve(
    tx.insert(auditLogs).values({
    actorUserId: input.actorUserId,
    actorRoleId: input.actorRoleId,
    actionType,
    entityType: "USER",
    entityId: input.targetUserId,
    requestId: input.requestId,
    traceId: input.traceId,
    beforeJson: {
      roleCode: input.previousRole,
    },
    afterJson: {
      roleCode: input.newRole,
    },
    changeSummary: `Role changed from ${input.previousRole} to ${input.newRole}`,
    sourceApp: "ADMIN_PORTAL",
    metadata: {
      eventType: actionType,
      actorUserId: input.actorUserId,
      targetUserId: input.targetUserId,
      previousRole: input.previousRole,
      newRole: input.newRole,
      reasonNote: input.reasonNote,
    },
    }),
  )
}
