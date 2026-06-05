import "server-only"

import { auditLogs } from "@/db/schema/audit"

type ProjectAuditMode = "create" | "update"

type ProjectAuditSnapshot = {
  projectId: string
  name: string
  slug: string
  isPublished: boolean
}

type ProjectAuditInput = {
  mode: ProjectAuditMode
  actorUserId: string
  actorRoleId?: string
  previous?: ProjectAuditSnapshot
  next: ProjectAuditSnapshot
  requestId?: string
  traceId?: string
}

type TransactionClient = {
  insert: (table: typeof auditLogs) => {
    values: (value: typeof auditLogs.$inferInsert) => unknown
  }
}

export type ProjectAuditActionType =
  | "PROJECT_CREATED"
  | "PROJECT_UPDATED"
  | "PROJECT_PUBLISHED"
  | "PROJECT_UNPUBLISHED"

export function buildSafeProjectAuditSnapshot(input: {
  projectId: string
  name: string
  slug: string
  isPublished: boolean
}): ProjectAuditSnapshot {
  return {
    projectId: input.projectId,
    name: input.name,
    slug: input.slug,
    isPublished: input.isPublished,
  }
}

export function resolveProjectAuditAction(input: {
  mode: ProjectAuditMode
  previous?: ProjectAuditSnapshot
  next: ProjectAuditSnapshot
}): ProjectAuditActionType {
  if (input.mode === "create") {
    return "PROJECT_CREATED"
  }

  if (input.previous && !input.previous.isPublished && input.next.isPublished) {
    return "PROJECT_PUBLISHED"
  }

  if (input.previous && input.previous.isPublished && !input.next.isPublished) {
    return "PROJECT_UNPUBLISHED"
  }

  return "PROJECT_UPDATED"
}

function buildChangedFields(previous: ProjectAuditSnapshot | undefined, next: ProjectAuditSnapshot): string[] {
  if (!previous) {
    return ["project"]
  }

  const changedFields: string[] = []

  if (previous.name !== next.name) {
    changedFields.push("name")
  }

  if (previous.slug !== next.slug) {
    changedFields.push("slug")
  }

  if (previous.isPublished !== next.isPublished) {
    changedFields.push("isPublished")
  }

  return changedFields
}

export async function writeProjectAudit(
  tx: TransactionClient,
  input: ProjectAuditInput,
): Promise<void> {
  const actionType = resolveProjectAuditAction({
    mode: input.mode,
    previous: input.previous,
    next: input.next,
  })

  const changedFields = buildChangedFields(input.previous, input.next)

  await Promise.resolve(
    tx.insert(auditLogs).values({
      actorUserId: input.actorUserId,
      actorRoleId: input.actorRoleId,
      actionType,
      entityType: "PROJECT",
      entityId: input.next.projectId,
      requestId: input.requestId,
      traceId: input.traceId,
      beforeJson: input.previous
        ? {
            name: input.previous.name,
            slug: input.previous.slug,
            isPublished: input.previous.isPublished,
          }
        : null,
      afterJson: {
        name: input.next.name,
        slug: input.next.slug,
        isPublished: input.next.isPublished,
      },
      changeSummary:
        input.mode === "create"
          ? `Project created: ${input.next.name}`
          : `Project updated: ${input.previous?.name ?? input.next.name} -> ${input.next.name}`,
      sourceApp: "ADMIN_PORTAL",
      metadata: {
        eventType: actionType,
        actorUserId: input.actorUserId,
        actorRoleId: input.actorRoleId,
        projectId: input.next.projectId,
        previousName: input.previous?.name ?? null,
        previousSlug: input.previous?.slug ?? null,
        previousIsPublished: input.previous?.isPublished ?? null,
        newName: input.next.name,
        newSlug: input.next.slug,
        newIsPublished: input.next.isPublished,
        changedFields,
      },
    }),
  )
}
