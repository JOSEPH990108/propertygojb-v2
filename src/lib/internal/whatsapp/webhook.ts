import "server-only"

import { createHash, createHmac, timingSafeEqual } from "crypto"

import { and, asc, eq, isNull, or, sql } from "drizzle-orm"

import { db } from "@/db"
import { auditLogs } from "@/db/schema/audit"
import {
  inquiries,
  leadActivities,
  leadAssignments,
  leadSources,
  leads,
  leadStatusHistory,
} from "@/db/schema/crm-leads"
import {
  whatsappAgentQueueMembers,
  whatsappAgentQueues,
  whatsappAssignmentRules,
  whatsappConversations,
  whatsappMessages,
  whatsappWebhookEvents,
} from "@/db/schema/whatsapp-routing"
import { normalizePhoneToE164 } from "@/lib/auth/otp/phone"
import {
  buildQueueCandidateOrder,
  findMatchedAssignmentRule,
  pickQueueMemberForStrategy,
  type AssignmentRuleSnapshot,
  type InboundRoutingContext,
  type QueueMemberSnapshot,
} from "@/lib/internal/whatsapp/routing"

const DEFAULT_PROVIDER = "WHATSAPP_CLOUD_API"
const DEFAULT_EVENT_TYPE = "message_received"
const WHATSAPP_SOURCE_CODE = "WHATSAPP_INBOUND"

type NormalizedInboundWhatsappPayload = {
  provider: string
  eventType: string
  eventKey: string
  providerEventId: string | null
  occurredAtProvider: Date | null
  channelAccountId: string | null
  providerConversationId: string | null
  customerPhoneE164: string
  customerPhoneNormalized: string
  customerDisplayName: string | null
  providerMessageId: string | null
  messageType: string
  textBody: string | null
  projectId: string | null
  regionId: string | null
  areaId: string | null
  preferredLanguage: string | null
  payload: unknown
}

type PersistedWebhookEvent = {
  id: string
  processingStatus: string
  conversationId: string | null
  messageId: string | null
  leadId: string | null
}

export type ProcessInboundWhatsappWebhookInput = {
  payload: unknown
  rawBody: string
  signatureHeader: string | null
}

export type ProcessInboundWhatsappWebhookSuccess = {
  ok: true
  duplicate: boolean
  webhookEventId: string
  leadId: string | null
  conversationId: string | null
  messageId: string | null
  assignment: {
    ownerUserId: string | null
    queueId: string | null
    ruleId: string | null
  } | null
}

export type ProcessInboundWhatsappWebhookFailureCode =
  | "INVALID_PAYLOAD"
  | "SIGNATURE_INVALID"
  | "SERVICE_UNAVAILABLE"
  | "PROCESSING_FAILED"

export type ProcessInboundWhatsappWebhookFailure = {
  ok: false
  code: ProcessInboundWhatsappWebhookFailureCode
  message: string
  httpStatus: number
  webhookEventId?: string
}

export type ProcessInboundWhatsappWebhookResult =
  | ProcessInboundWhatsappWebhookSuccess
  | ProcessInboundWhatsappWebhookFailure

function readText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") {
    return null
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  if (trimmed.length <= maxLength) {
    return trimmed
  }

  return trimmed.slice(0, maxLength)
}

function parseIsoDate(value: unknown): Date | null {
  if (typeof value !== "string") {
    return null
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return parsed
}

function normalizeMessageType(value: unknown): string {
  const candidate = readText(value, 30)
  if (!candidate) {
    return "TEXT"
  }

  const normalized = candidate.toUpperCase()
  const allowedTypes = new Set([
    "TEXT",
    "IMAGE",
    "DOCUMENT",
    "AUDIO",
    "VIDEO",
    "LOCATION",
    "CONTACT",
    "UNKNOWN",
  ])

  return allowedTypes.has(normalized) ? normalized : "UNKNOWN"
}

function toPhoneDigits(value: string): string {
  return value.replace(/\D/g, "")
}

function buildFallbackEventKey(rawBody: string): string {
  const digest = createHash("sha1").update(rawBody).digest("hex")
  return `hash:${digest}`
}

function resolveEventKey(input: {
  eventKey: string | null
  providerEventId: string | null
  providerMessageId: string | null
  rawBody: string
}): string {
  if (input.eventKey) {
    return input.eventKey
  }

  if (input.providerEventId) {
    return `provider:${input.providerEventId}`
  }

  if (input.providerMessageId) {
    return `message:${input.providerMessageId}`
  }

  return buildFallbackEventKey(input.rawBody)
}

function verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean | null {
  const secret = readText(process.env.WHATSAPP_WEBHOOK_SECRET, 256)
  if (!secret) {
    return null
  }

  if (!signatureHeader) {
    return false
  }

  const normalizedHeader = signatureHeader.startsWith("sha256=")
    ? signatureHeader.slice("sha256=".length)
    : signatureHeader

  const received = normalizedHeader.trim().toLowerCase()
  if (!received) {
    return false
  }

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex")

  if (received.length !== expected.length) {
    return false
  }

  return timingSafeEqual(Buffer.from(received), Buffer.from(expected))
}

function normalizeInboundPayload(
  payload: unknown,
  rawBody: string,
): { ok: true; data: NormalizedInboundWhatsappPayload } | { ok: false; message: string } {
  if (!payload || typeof payload !== "object") {
    return {
      ok: false,
      message: "Webhook payload must be a JSON object.",
    }
  }

  const candidate = payload as Record<string, unknown>

  const phoneRaw = readText(candidate.customerPhoneE164, 30)
  if (!phoneRaw) {
    return {
      ok: false,
      message: "customerPhoneE164 is required.",
    }
  }

  const normalizedPhone = normalizePhoneToE164(phoneRaw)
  if (!normalizedPhone.ok) {
    return {
      ok: false,
      message: "customerPhoneE164 is invalid.",
    }
  }

  const provider = readText(candidate.provider, 30) ?? DEFAULT_PROVIDER
  const providerEventId = readText(candidate.providerEventId, 150)
  const providerMessageId = readText(candidate.providerMessageId, 120)
  const eventKey = resolveEventKey({
    eventKey: readText(candidate.eventKey, 150),
    providerEventId,
    providerMessageId,
    rawBody,
  })

  const payloadData = Object.prototype.hasOwnProperty.call(candidate, "payload")
    ? candidate.payload
    : payload

  return {
    ok: true,
    data: {
      provider,
      eventType: readText(candidate.eventType, 80) ?? DEFAULT_EVENT_TYPE,
      eventKey,
      providerEventId,
      occurredAtProvider: parseIsoDate(candidate.occurredAtProvider),
      channelAccountId: readText(candidate.channelAccountId, 100),
      providerConversationId: readText(candidate.providerConversationId, 120),
      customerPhoneE164: normalizedPhone.data.phoneE164,
      customerPhoneNormalized: toPhoneDigits(normalizedPhone.data.phoneE164),
      customerDisplayName: readText(candidate.customerDisplayName, 150),
      providerMessageId,
      messageType: normalizeMessageType(candidate.messageType),
      textBody: readText(candidate.textBody, 4000),
      projectId: readText(candidate.projectId, 100),
      regionId: readText(candidate.regionId, 100),
      areaId: readText(candidate.areaId, 100),
      preferredLanguage: readText(candidate.preferredLanguage, 20),
      payload: payloadData,
    },
  }
}

function buildFailure(
  code: ProcessInboundWhatsappWebhookFailureCode,
  message: string,
  httpStatus: number,
  webhookEventId?: string,
): ProcessInboundWhatsappWebhookFailure {
  return {
    ok: false,
    code,
    message,
    httpStatus,
    webhookEventId,
  }
}

async function getExistingWebhookEvent(provider: string, eventKey: string): Promise<PersistedWebhookEvent | null> {
  if (!db) {
    return null
  }

  const rows = await db
    .select({
      id: whatsappWebhookEvents.id,
      processingStatus: whatsappWebhookEvents.processingStatus,
      conversationId: whatsappWebhookEvents.conversationId,
      messageId: whatsappWebhookEvents.messageId,
      leadId: whatsappWebhookEvents.leadId,
    })
    .from(whatsappWebhookEvents)
    .where(and(eq(whatsappWebhookEvents.provider, provider), eq(whatsappWebhookEvents.eventKey, eventKey)))
    .limit(1)

  return rows[0] ?? null
}

async function persistWebhookEvent(
  payload: NormalizedInboundWhatsappPayload,
  signatureValid: boolean | null,
): Promise<{ duplicate: boolean; event: PersistedWebhookEvent }> {
  if (!db) {
    throw new Error("SERVICE_UNAVAILABLE")
  }

  const now = new Date()

  const rows = await db
    .insert(whatsappWebhookEvents)
    .values({
      provider: payload.provider,
      eventType: payload.eventType,
      eventKey: payload.eventKey,
      providerEventId: payload.providerEventId,
      occurredAtProvider: payload.occurredAtProvider,
      receivedAtServer: now,
      signatureValid,
      processingStatus: "RECEIVED",
      payload: payload.payload,
    })
    .onConflictDoNothing({
      target: [whatsappWebhookEvents.provider, whatsappWebhookEvents.eventKey],
    })
    .returning({
      id: whatsappWebhookEvents.id,
      processingStatus: whatsappWebhookEvents.processingStatus,
      conversationId: whatsappWebhookEvents.conversationId,
      messageId: whatsappWebhookEvents.messageId,
      leadId: whatsappWebhookEvents.leadId,
    })

  if (rows[0]) {
    return {
      duplicate: false,
      event: rows[0],
    }
  }

  const existing = await getExistingWebhookEvent(payload.provider, payload.eventKey)
  if (!existing) {
    throw new Error("WEBHOOK_EVENT_CONFLICT_RESOLUTION_FAILED")
  }

  return {
    duplicate: true,
    event: existing,
  }
}

async function markWebhookEventProcessing(
  webhookEventId: string,
  signatureValid: boolean | null,
): Promise<void> {
  if (!db) {
    return
  }

  await db
    .update(whatsappWebhookEvents)
    .set({
      processingStatus: "PROCESSING",
      processingAttempts: sql`${whatsappWebhookEvents.processingAttempts} + 1`,
      processingError: null,
      nextRetryAt: null,
      signatureValid,
    })
    .where(eq(whatsappWebhookEvents.id, webhookEventId))
}

async function markWebhookEventFailed(
  webhookEventId: string,
  message: string,
  signatureValid: boolean | null,
): Promise<void> {
  if (!db) {
    return
  }

  await db
    .update(whatsappWebhookEvents)
    .set({
      processingStatus: "FAILED",
      processingError: message,
      nextRetryAt: new Date(Date.now() + 5 * 60 * 1000),
      signatureValid,
    })
    .where(eq(whatsappWebhookEvents.id, webhookEventId))
}

async function markWebhookEventProcessed(input: {
  webhookEventId: string
  leadId: string | null
  conversationId: string | null
  messageId: string | null
  signatureValid: boolean | null
}): Promise<void> {
  if (!db) {
    return
  }

  await db
    .update(whatsappWebhookEvents)
    .set({
      processingStatus: "PROCESSED",
      processingError: null,
      nextRetryAt: null,
      signatureValid: input.signatureValid,
      leadId: input.leadId,
      conversationId: input.conversationId,
      messageId: input.messageId,
    })
    .where(eq(whatsappWebhookEvents.id, input.webhookEventId))
}

type ProcessingOutcome = {
  leadId: string
  conversationId: string
  messageId: string
  assignment: {
    ownerUserId: string | null
    queueId: string | null
    ruleId: string | null
  }
}

export async function processInboundWhatsappWebhook(
  input: ProcessInboundWhatsappWebhookInput,
): Promise<ProcessInboundWhatsappWebhookResult> {
  if (!db) {
    return buildFailure("SERVICE_UNAVAILABLE", "Database is not configured.", 503)
  }

  const normalizedPayload = normalizeInboundPayload(input.payload, input.rawBody)
  if (!normalizedPayload.ok) {
    return buildFailure("INVALID_PAYLOAD", normalizedPayload.message, 400)
  }

  const signatureValid = verifyWebhookSignature(input.rawBody, input.signatureHeader)

  let persistedEvent: PersistedWebhookEvent

  try {
    const persistResult = await persistWebhookEvent(normalizedPayload.data, signatureValid)
    persistedEvent = persistResult.event

    if (persistResult.duplicate) {
      return {
        ok: true,
        duplicate: true,
        webhookEventId: persistedEvent.id,
        leadId: persistedEvent.leadId,
        conversationId: persistedEvent.conversationId,
        messageId: persistedEvent.messageId,
        assignment: null,
      }
    }
  } catch {
    return buildFailure("PROCESSING_FAILED", "Webhook event could not be persisted.", 500)
  }

  if (signatureValid === false) {
    await markWebhookEventFailed(persistedEvent.id, "Invalid webhook signature.", signatureValid)
    return buildFailure(
      "SIGNATURE_INVALID",
      "Webhook signature verification failed.",
      401,
      persistedEvent.id,
    )
  }

  await markWebhookEventProcessing(persistedEvent.id, signatureValid)

  try {
    const outcome = await db.transaction(async (tx): Promise<ProcessingOutcome> => {
      const now = new Date()

      const sourceRows = await tx
        .select({
          id: leadSources.id,
          assignmentSlaMinutes: leadSources.assignmentSlaMinutes,
          firstResponseSlaMinutes: leadSources.firstResponseSlaMinutes,
        })
        .from(leadSources)
        .where(
          and(
            eq(leadSources.code, WHATSAPP_SOURCE_CODE),
            eq(leadSources.isActive, true),
            isNull(leadSources.deletedAt),
          ),
        )
        .limit(1)

      const source = sourceRows[0]
      if (!source) {
        throw new Error("WHATSAPP lead source is missing.")
      }

      const existingLeadRows = await tx
        .select({
          id: leads.id,
          currentStatus: leads.currentStatus,
          currentAssigneeUserId: leads.currentAssigneeUserId,
          currentQueueId: leads.currentQueueId,
          firstAssignedAt: leads.firstAssignedAt,
          assignmentDueAt: leads.assignmentDueAt,
          firstResponseDueAt: leads.firstResponseDueAt,
        })
        .from(leads)
        .where(
          and(
            isNull(leads.deletedAt),
            or(
              eq(leads.primaryPhoneNormalized, normalizedPayload.data.customerPhoneNormalized),
              eq(leads.primaryPhoneNormalized, normalizedPayload.data.customerPhoneE164),
            ),
          ),
        )
        .orderBy(asc(leads.createdAt))
        .limit(1)

      const leadRow = existingLeadRows[0]

      const assignmentDueAt = source.assignmentSlaMinutes
        ? new Date(now.getTime() + source.assignmentSlaMinutes * 60 * 1000)
        : null

      const firstResponseDueAt = source.firstResponseSlaMinutes
        ? new Date(now.getTime() + source.firstResponseSlaMinutes * 60 * 1000)
        : null

      const leadRecord = leadRow
        ? leadRow
        : (
            await tx
              .insert(leads)
              .values({
                sourceId: source.id,
                fullName: normalizedPayload.data.customerDisplayName,
                primaryPhoneE164: normalizedPayload.data.customerPhoneE164,
                primaryPhoneNormalized: normalizedPayload.data.customerPhoneNormalized,
                preferredLanguage: normalizedPayload.data.preferredLanguage,
                preferredRegionId: normalizedPayload.data.regionId,
                preferredAreaId: normalizedPayload.data.areaId,
                currentStatus: "NEW",
                firstInquiryAt: now,
                assignmentDueAt,
                firstResponseDueAt,
                metadata: {
                  source: WHATSAPP_SOURCE_CODE,
                  provider: normalizedPayload.data.provider,
                  webhookEventKey: normalizedPayload.data.eventKey,
                },
              })
              .returning({
                id: leads.id,
                currentStatus: leads.currentStatus,
                currentAssigneeUserId: leads.currentAssigneeUserId,
                currentQueueId: leads.currentQueueId,
                firstAssignedAt: leads.firstAssignedAt,
                assignmentDueAt: leads.assignmentDueAt,
                firstResponseDueAt: leads.firstResponseDueAt,
              })
          )[0]

      if (!leadRecord) {
        throw new Error("Lead could not be resolved for webhook event.")
      }

      const inquiryRows = await tx
        .insert(inquiries)
        .values({
          leadId: leadRecord.id,
          sourceId: source.id,
          channel: WHATSAPP_SOURCE_CODE,
          externalReference: normalizedPayload.data.providerMessageId,
          requesterName: normalizedPayload.data.customerDisplayName,
          requesterPhoneE164: normalizedPayload.data.customerPhoneE164,
          requesterPhoneNormalized: normalizedPayload.data.customerPhoneNormalized,
          projectId: normalizedPayload.data.projectId,
          messageText: normalizedPayload.data.textBody,
          payload: normalizedPayload.data.payload,
          receivedAt: now,
        })
        .onConflictDoNothing({
          target: inquiries.externalReference,
        })
        .returning({
          id: inquiries.id,
        })

      const inquiryId = inquiryRows[0]?.id
        ? inquiryRows[0].id
        : normalizedPayload.data.providerMessageId
          ? (
              await tx
                .select({
                  id: inquiries.id,
                })
                .from(inquiries)
                .where(eq(inquiries.externalReference, normalizedPayload.data.providerMessageId))
                .limit(1)
            )[0]?.id ?? null
          : null

      const existingConversationRows = await tx
        .select({
          id: whatsappConversations.id,
          ownerUserId: whatsappConversations.ownerUserId,
          queueId: whatsappConversations.queueId,
        })
        .from(whatsappConversations)
        .where(
          and(
            eq(whatsappConversations.provider, normalizedPayload.data.provider),
            eq(whatsappConversations.customerPhoneNormalized, normalizedPayload.data.customerPhoneNormalized),
            eq(whatsappConversations.isOpen, true),
            isNull(whatsappConversations.deletedAt),
          ),
        )
        .limit(1)

      const existingConversation = existingConversationRows[0]

      const conversationId = existingConversation
        ? (
            await tx
              .update(whatsappConversations)
              .set({
                leadId: leadRecord.id,
                inquiryId: inquiryId ?? null,
                channelAccountId: normalizedPayload.data.channelAccountId,
                providerConversationId: normalizedPayload.data.providerConversationId,
                customerDisplayName: normalizedPayload.data.customerDisplayName,
                lastInboundAt: now,
                lastMessageAt: now,
              })
              .where(eq(whatsappConversations.id, existingConversation.id))
              .returning({
                id: whatsappConversations.id,
              })
          )[0]?.id ?? existingConversation.id
        : (
            await tx
              .insert(whatsappConversations)
              .values({
                leadId: leadRecord.id,
                inquiryId,
                provider: normalizedPayload.data.provider,
                channelAccountId: normalizedPayload.data.channelAccountId,
                providerConversationId: normalizedPayload.data.providerConversationId,
                customerPhoneE164: normalizedPayload.data.customerPhoneE164,
                customerPhoneNormalized: normalizedPayload.data.customerPhoneNormalized,
                customerDisplayName: normalizedPayload.data.customerDisplayName,
                isOpen: true,
                firstInboundAt: now,
                lastInboundAt: now,
                lastMessageAt: now,
              })
              .returning({
                id: whatsappConversations.id,
              })
          )[0]?.id

      if (!conversationId) {
        throw new Error("Conversation could not be resolved for webhook event.")
      }

      const messageRows = normalizedPayload.data.providerMessageId
        ? await tx
            .insert(whatsappMessages)
            .values({
              conversationId,
              leadId: leadRecord.id,
              direction: "INBOUND",
              messageType: normalizedPayload.data.messageType,
              providerMessageId: normalizedPayload.data.providerMessageId,
              textBody: normalizedPayload.data.textBody,
              payload: normalizedPayload.data.payload,
              sentAtProvider: normalizedPayload.data.occurredAtProvider,
            })
            .onConflictDoUpdate({
              target: whatsappMessages.providerMessageId,
              set: {
                conversationId,
                leadId: leadRecord.id,
                direction: "INBOUND",
                messageType: normalizedPayload.data.messageType,
                textBody: normalizedPayload.data.textBody,
                payload: normalizedPayload.data.payload,
                sentAtProvider: normalizedPayload.data.occurredAtProvider,
              },
            })
            .returning({
              id: whatsappMessages.id,
            })
        : await tx
            .insert(whatsappMessages)
            .values({
              conversationId,
              leadId: leadRecord.id,
              direction: "INBOUND",
              messageType: normalizedPayload.data.messageType,
              textBody: normalizedPayload.data.textBody,
              payload: normalizedPayload.data.payload,
              sentAtProvider: normalizedPayload.data.occurredAtProvider,
            })
            .returning({
              id: whatsappMessages.id,
            })

      const messageId = messageRows[0]?.id
      if (!messageId) {
        throw new Error("Inbound message could not be persisted.")
      }

      const ruleRows = await tx
        .select({
          id: whatsappAssignmentRules.id,
          priority: whatsappAssignmentRules.priority,
          isActive: whatsappAssignmentRules.isActive,
          matchSourceId: whatsappAssignmentRules.matchSourceId,
          matchRegionId: whatsappAssignmentRules.matchRegionId,
          matchAreaId: whatsappAssignmentRules.matchAreaId,
          matchProjectId: whatsappAssignmentRules.matchProjectId,
          matchLanguage: whatsappAssignmentRules.matchLanguage,
          queueId: whatsappAssignmentRules.queueId,
          assignToUserId: whatsappAssignmentRules.assignToUserId,
          fallbackQueueId: whatsappAssignmentRules.fallbackQueueId,
          effectiveFrom: whatsappAssignmentRules.effectiveFrom,
          effectiveTo: whatsappAssignmentRules.effectiveTo,
          stopProcessingAfterMatch: whatsappAssignmentRules.stopProcessingAfterMatch,
        })
        .from(whatsappAssignmentRules)
        .where(
          and(
            eq(whatsappAssignmentRules.isActive, true),
            eq(whatsappAssignmentRules.triggerChannel, "WHATSAPP"),
            isNull(whatsappAssignmentRules.deletedAt),
          ),
        )
        .orderBy(asc(whatsappAssignmentRules.priority), asc(whatsappAssignmentRules.id))

      const rules: AssignmentRuleSnapshot[] = ruleRows.map((row) => ({
        id: row.id,
        priority: row.priority,
        isActive: row.isActive,
        matchSourceId: row.matchSourceId,
        matchRegionId: row.matchRegionId,
        matchAreaId: row.matchAreaId,
        matchProjectId: row.matchProjectId,
        matchLanguage: row.matchLanguage,
        queueId: row.queueId,
        assignToUserId: row.assignToUserId,
        fallbackQueueId: row.fallbackQueueId,
        effectiveFrom: row.effectiveFrom,
        effectiveTo: row.effectiveTo,
        stopProcessingAfterMatch: row.stopProcessingAfterMatch,
      }))

      const routingContext: InboundRoutingContext = {
        sourceId: source.id,
        regionId: normalizedPayload.data.regionId,
        areaId: normalizedPayload.data.areaId,
        projectId: normalizedPayload.data.projectId,
        preferredLanguage: normalizedPayload.data.preferredLanguage,
        now,
      }

      const matchedRule = findMatchedAssignmentRule(rules, routingContext)

      const generalQueueRows = await tx
        .select({
          id: whatsappAgentQueues.id,
        })
        .from(whatsappAgentQueues)
        .where(
          and(
            eq(whatsappAgentQueues.code, "GENERAL"),
            eq(whatsappAgentQueues.isActive, true),
            isNull(whatsappAgentQueues.deletedAt),
          ),
        )
        .limit(1)

      const generalQueueId = generalQueueRows[0]?.id ?? null

      let resolvedOwnerUserId: string | null = null
      let resolvedQueueId: string | null = null
      let assignmentType: "AUTO" | "ROUND_ROBIN" = "AUTO"

      if (matchedRule?.assignToUserId) {
        resolvedOwnerUserId = matchedRule.assignToUserId
        resolvedQueueId = matchedRule.queueId ?? matchedRule.fallbackQueueId ?? generalQueueId
      } else {
        const queueCandidateOrder = buildQueueCandidateOrder({
          matchedRule,
          generalQueueId,
        })

        for (const queueId of queueCandidateOrder) {
          const queueRows = await tx
            .select({
              id: whatsappAgentQueues.id,
              assignmentStrategy: whatsappAgentQueues.assignmentStrategy,
            })
            .from(whatsappAgentQueues)
            .where(
              and(
                eq(whatsappAgentQueues.id, queueId),
                eq(whatsappAgentQueues.isActive, true),
                isNull(whatsappAgentQueues.deletedAt),
              ),
            )
            .limit(1)

          const queue = queueRows[0]
          if (!queue) {
            continue
          }

          const memberRows = await tx
            .select({
              id: whatsappAgentQueueMembers.id,
              userId: whatsappAgentQueueMembers.userId,
              sortOrder: whatsappAgentQueueMembers.sortOrder,
              lastAssignedAt: whatsappAgentQueueMembers.lastAssignedAt,
              isActive: whatsappAgentQueueMembers.isActive,
            })
            .from(whatsappAgentQueueMembers)
            .where(
              and(
                eq(whatsappAgentQueueMembers.queueId, queueId),
                eq(whatsappAgentQueueMembers.isActive, true),
                isNull(whatsappAgentQueueMembers.deletedAt),
              ),
            )

          const selectedMember = pickQueueMemberForStrategy(
            queue.assignmentStrategy,
            memberRows.map(
              (member): QueueMemberSnapshot => ({
                id: member.id,
                userId: member.userId,
                sortOrder: member.sortOrder,
                lastAssignedAt: member.lastAssignedAt,
                isActive: member.isActive,
              }),
            ),
          )

          resolvedQueueId = queueId

          if (!selectedMember) {
            continue
          }

          resolvedOwnerUserId = selectedMember.userId
          assignmentType = queue.assignmentStrategy === "ROUND_ROBIN" ? "ROUND_ROBIN" : "AUTO"

          await tx
            .update(whatsappAgentQueueMembers)
            .set({
              lastAssignedAt: now,
            })
            .where(eq(whatsappAgentQueueMembers.id, selectedMember.id))

          break
        }
      }

      const currentAssignmentRows = await tx
        .select({
          id: leadAssignments.id,
          toUserId: leadAssignments.toUserId,
          queueId: leadAssignments.queueId,
        })
        .from(leadAssignments)
        .where(
          and(
            eq(leadAssignments.leadId, leadRecord.id),
            eq(leadAssignments.isCurrent, true),
            isNull(leadAssignments.deletedAt),
          ),
        )
        .limit(1)

      const currentAssignment = currentAssignmentRows[0]

      const hasAssignmentChanged =
        (currentAssignment?.toUserId ?? null) !== resolvedOwnerUserId ||
        (currentAssignment?.queueId ?? null) !== resolvedQueueId

      let activeAssignmentId = currentAssignment?.id ?? null

      if (hasAssignmentChanged) {
        if (currentAssignment) {
          await tx
            .update(leadAssignments)
            .set({
              isCurrent: false,
              effectiveTo: now,
            })
            .where(eq(leadAssignments.id, currentAssignment.id))
        }

        if (resolvedOwnerUserId || resolvedQueueId) {
          const assignmentRows = await tx
            .insert(leadAssignments)
            .values({
              leadId: leadRecord.id,
              fromUserId: currentAssignment?.toUserId ?? null,
              toUserId: resolvedOwnerUserId,
              queueId: resolvedQueueId,
              assignedByUserId: null,
              assignmentType,
              reasonCode: matchedRule ? "RULE_MATCH" : "FALLBACK_ASSIGNMENT",
              reasonNote: matchedRule ? `Matched assignment rule ${matchedRule.id}` : "Matched fallback queue policy",
              ruleId: matchedRule?.id ?? null,
              effectiveFrom: now,
              isCurrent: true,
            })
            .returning({
              id: leadAssignments.id,
            })

          activeAssignmentId = assignmentRows[0]?.id ?? null
        }
      }

      let nextLeadStatus = leadRecord.currentStatus
      if (resolvedOwnerUserId) {
        nextLeadStatus = "ASSIGNED"
      } else if (leadRecord.currentStatus === "NEW") {
        nextLeadStatus = "UNCONTACTED"
      }

      await tx
        .update(leads)
        .set({
          currentAssigneeUserId: resolvedOwnerUserId,
          currentQueueId: resolvedQueueId,
          currentStatus: nextLeadStatus,
          firstAssignedAt: leadRecord.firstAssignedAt ?? (resolvedOwnerUserId ? now : null),
          assignmentDueAt: leadRecord.assignmentDueAt ?? assignmentDueAt,
          firstResponseDueAt: leadRecord.firstResponseDueAt ?? firstResponseDueAt,
          lastActivityAt: now,
        })
        .where(eq(leads.id, leadRecord.id))

      if (nextLeadStatus !== leadRecord.currentStatus) {
        await tx.insert(leadStatusHistory).values({
          leadId: leadRecord.id,
          fromStatus: leadRecord.currentStatus,
          toStatus: nextLeadStatus,
          changedByUserId: null,
          changedAt: now,
          reasonCode: "WHATSAPP_INBOUND",
          reasonNote: "Lead status updated by inbound WhatsApp routing.",
          sourceEventType: "WHATSAPP_INBOUND",
        })
      }

      await tx.insert(leadActivities).values({
        leadId: leadRecord.id,
        assignmentId: activeAssignmentId,
        actorUserId: null,
        activityType: "WHATSAPP_INBOUND",
        title: "Inbound WhatsApp message",
        body: normalizedPayload.data.textBody,
        metadata: {
          webhookEventKey: normalizedPayload.data.eventKey,
          provider: normalizedPayload.data.provider,
          messageId,
          queueId: resolvedQueueId,
          ownerUserId: resolvedOwnerUserId,
          ruleId: matchedRule?.id ?? null,
        },
      })

      if (hasAssignmentChanged) {
        await tx.insert(auditLogs).values({
          actorUserId: null,
          actionType: resolvedOwnerUserId ? "LEAD_ASSIGNED" : "LEAD_ROUTING_PENDING",
          entityType: "LEAD",
          entityId: leadRecord.id,
          beforeJson: {
            ownerUserId: currentAssignment?.toUserId ?? null,
            queueId: currentAssignment?.queueId ?? null,
          },
          afterJson: {
            ownerUserId: resolvedOwnerUserId,
            queueId: resolvedQueueId,
          },
          changeSummary: resolvedOwnerUserId
            ? `Lead auto-assigned to user ${resolvedOwnerUserId}`
            : "Lead routing requires manual review due to missing active queue member.",
          sourceApp: "WHATSAPP_WEBHOOK",
          metadata: {
            eventType: "WHATSAPP_INBOUND_ROUTED",
            leadId: leadRecord.id,
            queueId: resolvedQueueId,
            ownerUserId: resolvedOwnerUserId,
            ruleId: matchedRule?.id ?? null,
            assignmentType,
          },
        })
      }

      await tx
        .update(whatsappConversations)
        .set({
          leadId: leadRecord.id,
          inquiryId: inquiryId ?? null,
          ownerUserId: resolvedOwnerUserId,
          queueId: resolvedQueueId,
          lastInboundAt: now,
          lastMessageAt: now,
        })
        .where(eq(whatsappConversations.id, conversationId))

      return {
        leadId: leadRecord.id,
        conversationId,
        messageId,
        assignment: {
          ownerUserId: resolvedOwnerUserId,
          queueId: resolvedQueueId,
          ruleId: matchedRule?.id ?? null,
        },
      }
    })

    await markWebhookEventProcessed({
      webhookEventId: persistedEvent.id,
      leadId: outcome.leadId,
      conversationId: outcome.conversationId,
      messageId: outcome.messageId,
      signatureValid,
    })

    return {
      ok: true,
      duplicate: false,
      webhookEventId: persistedEvent.id,
      leadId: outcome.leadId,
      conversationId: outcome.conversationId,
      messageId: outcome.messageId,
      assignment: outcome.assignment,
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error && error.message
        ? error.message.slice(0, 1000)
        : "Webhook processing failed."

    await markWebhookEventFailed(persistedEvent.id, errorMessage, signatureValid)

    return buildFailure(
      "PROCESSING_FAILED",
      "Webhook processing failed. Check webhook event logs for details.",
      500,
      persistedEvent.id,
    )
  }
}
