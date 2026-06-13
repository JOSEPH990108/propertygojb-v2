import "server-only"

import { and, desc, eq, isNull, sql, type SQL } from "drizzle-orm"

import { db } from "@/db"
import { user } from "@/db/schema/identity-auth"
import {
  whatsappAgentQueueMembers,
  whatsappAgentQueues,
  whatsappConversations,
} from "@/db/schema/whatsapp-routing"
import { requireRole } from "@/lib/auth/guards"

export type WorkspaceWhatsappQueueItem = {
  id: string
  code: string
  name: string
  assignmentStrategy: string
  isActive: boolean
  memberCount: number
}

export type WorkspaceWhatsappConversationItem = {
  id: string
  customerDisplayName: string | null
  customerPhoneE164: string
  queueName: string | null
  ownerName: string | null
  lastMessageAt: string | null
}

export type WorkspaceWhatsappOverview = {
  queues: WorkspaceWhatsappQueueItem[]
  openConversations: WorkspaceWhatsappConversationItem[]
}

type ListWorkspaceWhatsappOverviewOptions = {
  nextPath?: string
  limit?: number
}

function resolveActorUserId(value: unknown): string | null {
  if (!value || typeof value !== "object") {
    return null
  }

  const candidate = (value as { id?: unknown }).id
  return typeof candidate === "string" && candidate ? candidate : null
}

function normalizePositiveInt(value: number | undefined, fallback: number, max: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback
  }

  const normalized = Math.trunc(value)
  if (normalized < 1) {
    return fallback
  }

  return Math.min(normalized, max)
}

async function resolveMemberCount(queueId: string): Promise<number> {
  if (!db) {
    return 0
  }

  const rows = await db
    .select({
      count: sql<number>`count(*)::int`,
    })
    .from(whatsappAgentQueueMembers)
    .where(
      and(
        eq(whatsappAgentQueueMembers.queueId, queueId),
        eq(whatsappAgentQueueMembers.isActive, true),
        isNull(whatsappAgentQueueMembers.deletedAt),
      ),
    )

  return rows[0]?.count ?? 0
}

export async function listWorkspaceWhatsappOverview(
  options: ListWorkspaceWhatsappOverviewOptions = {},
): Promise<WorkspaceWhatsappOverview> {
  const authContext = await requireRole(["ADMIN", "SUPER_ADMIN", "AGENT"], {
    nextPath: options.nextPath,
  })

  if (!db) {
    return {
      queues: [],
      openConversations: [],
    }
  }

  const actorUserId = resolveActorUserId(authContext.user)
  const limit = normalizePositiveInt(options.limit, 15, 50)

  const queueRows =
    authContext.roleCode === "AGENT"
      ? actorUserId
        ? await db
            .select({
              id: whatsappAgentQueues.id,
              code: whatsappAgentQueues.code,
              name: whatsappAgentQueues.name,
              assignmentStrategy: whatsappAgentQueues.assignmentStrategy,
              isActive: whatsappAgentQueues.isActive,
            })
            .from(whatsappAgentQueues)
            .innerJoin(
              whatsappAgentQueueMembers,
              and(
                eq(whatsappAgentQueueMembers.queueId, whatsappAgentQueues.id),
                eq(whatsappAgentQueueMembers.userId, actorUserId),
                eq(whatsappAgentQueueMembers.isActive, true),
                isNull(whatsappAgentQueueMembers.deletedAt),
              ),
            )
            .where(isNull(whatsappAgentQueues.deletedAt))
            .orderBy(desc(whatsappAgentQueues.isActive), whatsappAgentQueues.name)
            .limit(limit)
        : []
      : await db
          .select({
            id: whatsappAgentQueues.id,
            code: whatsappAgentQueues.code,
            name: whatsappAgentQueues.name,
            assignmentStrategy: whatsappAgentQueues.assignmentStrategy,
            isActive: whatsappAgentQueues.isActive,
          })
          .from(whatsappAgentQueues)
          .where(isNull(whatsappAgentQueues.deletedAt))
          .orderBy(desc(whatsappAgentQueues.isActive), whatsappAgentQueues.name)
          .limit(limit)

  const queues = await Promise.all(
    queueRows.map(async (row) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      assignmentStrategy: row.assignmentStrategy,
      isActive: row.isActive,
      memberCount: await resolveMemberCount(row.id),
    })),
  )

  const conversationWhereClauses: SQL<unknown>[] = [
    isNull(whatsappConversations.deletedAt),
    eq(whatsappConversations.isOpen, true),
  ]

  if (authContext.roleCode === "AGENT") {
    if (!actorUserId) {
      return {
        queues,
        openConversations: [],
      }
    }

    conversationWhereClauses.push(eq(whatsappConversations.ownerUserId, actorUserId))
  }

  const conversationWhereExpression =
    conversationWhereClauses.length === 1
      ? conversationWhereClauses[0]
      : and(...conversationWhereClauses)

  const openConversationRows = await db
    .select({
      id: whatsappConversations.id,
      customerDisplayName: whatsappConversations.customerDisplayName,
      customerPhoneE164: whatsappConversations.customerPhoneE164,
      queueName: whatsappAgentQueues.name,
      ownerName: user.name,
      lastMessageAt: whatsappConversations.lastMessageAt,
    })
    .from(whatsappConversations)
    .leftJoin(whatsappAgentQueues, eq(whatsappConversations.queueId, whatsappAgentQueues.id))
    .leftJoin(user, eq(whatsappConversations.ownerUserId, user.id))
    .where(conversationWhereExpression)
    .orderBy(desc(whatsappConversations.lastMessageAt), desc(whatsappConversations.updatedAt))
    .limit(limit)

  return {
    queues,
    openConversations: openConversationRows.map((row) => ({
      id: row.id,
      customerDisplayName: row.customerDisplayName,
      customerPhoneE164: row.customerPhoneE164,
      queueName: row.queueName,
      ownerName: row.ownerName,
      lastMessageAt: row.lastMessageAt ? row.lastMessageAt.toISOString() : null,
    })),
  }
}
