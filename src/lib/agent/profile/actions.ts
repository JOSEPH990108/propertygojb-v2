import "server-only"

import { and, eq, ne } from "drizzle-orm"

import { ROUTES } from "@/config/routes"
import { db } from "@/db"
import { auditLogs } from "@/db/schema/audit"
import { roles, user } from "@/db/schema/identity-auth"
import { requireRole } from "@/lib/auth/guards"

export type AgentProfile = {
  userId: string
  roleCode: string | null
  name: string
  email: string
  phoneNumber: string | null
  phoneNumberVerified: boolean
  nationality: string | null
  renNumber: string | null
  agencyName: string | null
  onboardingCompleted: boolean
  createdAt: string
  updatedAt: string
}

export type UpdateAgentProfileBasicsInput = {
  name?: string
  phoneNumber?: string | null
  nationality?: string | null
  renNumber?: string | null
  agencyName?: string | null
  nextPath?: string
}

export type UpdateAgentProfileBasicsFailureCode =
  | "UNAUTHENTICATED"
  | "VALIDATION_FAILED"
  | "PROFILE_NOT_FOUND"
  | "PHONE_ALREADY_USED"
  | "UPDATE_FAILED"

export type UpdateAgentProfileBasicsSuccess = {
  ok: true
  profile: AgentProfile
}

export type UpdateAgentProfileBasicsFailure = {
  ok: false
  code: UpdateAgentProfileBasicsFailureCode
  message: string
}

export type UpdateAgentProfileBasicsResult =
  | UpdateAgentProfileBasicsSuccess
  | UpdateAgentProfileBasicsFailure

export type UpdateAgentAvailabilityInput = {
  isAvailable?: boolean | string
  note?: string
  nextPath?: string
}

export type UpdateAgentAvailabilityResult = {
  ok: false
  code: "NOT_SUPPORTED"
  message: string
}

type AgentProfileRow = {
  userId: string
  roleCode: string | null
  name: string
  email: string
  phoneNumber: string | null
  phoneNumberVerified: boolean
  nationality: string | null
  renNumber: string | null
  agencyName: string | null
  onboardingCompleted: boolean
  createdAt: Date
  updatedAt: Date
}

function resolveActorUserId(value: unknown): string | null {
  if (!value || typeof value !== "object") {
    return null
  }

  const candidate = (value as { id?: unknown }).id
  return typeof candidate === "string" && candidate ? candidate : null
}

function normalizeRequiredName(value: unknown): string | null {
  if (typeof value !== "string") {
    return null
  }

  const normalized = value.trim()
  if (!normalized) {
    return null
  }

  return normalized.length <= 150 ? normalized : normalized.slice(0, 150)
}

function normalizeNullableText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") {
    return null
  }

  const normalized = value.trim()
  if (!normalized) {
    return null
  }

  return normalized.length <= maxLength ? normalized : normalized.slice(0, maxLength)
}

function normalizeOptionalPhoneNumber(value: unknown): { value: string | null; invalid: boolean } {
  if (typeof value !== "string") {
    return { value: null, invalid: false }
  }

  const normalized = value.trim()
  if (!normalized) {
    return { value: null, invalid: false }
  }

  const compact = normalized.replace(/[\s()-]/g, "")
  if (!/^\+?[0-9]{8,20}$/.test(compact)) {
    return { value: null, invalid: true }
  }

  return { value: compact, invalid: false }
}

function mapProfile(row: AgentProfileRow): AgentProfile {
  return {
    userId: row.userId,
    roleCode: row.roleCode,
    name: row.name,
    email: row.email,
    phoneNumber: row.phoneNumber,
    phoneNumberVerified: row.phoneNumberVerified,
    nationality: row.nationality,
    renNumber: row.renNumber,
    agencyName: row.agencyName,
    onboardingCompleted: row.onboardingCompleted,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

function buildFailure(
  code: UpdateAgentProfileBasicsFailureCode,
  message: string,
): UpdateAgentProfileBasicsFailure {
  return {
    ok: false,
    code,
    message,
  }
}

export async function getAgentProfile(options: { nextPath?: string } = {}): Promise<AgentProfile | null> {
  const authContext = await requireRole(["AGENT"], {
    nextPath: options.nextPath ?? ROUTES.agent.profile,
  })

  if (!db) {
    return null
  }

  const actorUserId = resolveActorUserId(authContext.user)
  if (!actorUserId) {
    return null
  }

  const profileRows = await db
    .select({
      userId: user.id,
      roleCode: roles.code,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      phoneNumberVerified: user.phoneNumberVerified,
      nationality: user.nationality,
      renNumber: user.renNumber,
      agencyName: user.agencyName,
      onboardingCompleted: user.onboardingCompleted,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    })
    .from(user)
    .leftJoin(roles, eq(user.roleId, roles.id))
    .where(eq(user.id, actorUserId))
    .limit(1)

  const profile = profileRows[0]
  return profile ? mapProfile(profile) : null
}

export async function updateAgentProfileBasics(
  input: UpdateAgentProfileBasicsInput,
): Promise<UpdateAgentProfileBasicsResult> {
  const authContext = await requireRole(["AGENT"], {
    nextPath: input.nextPath ?? ROUTES.agent.profile,
  })

  if (!db) {
    return buildFailure("UPDATE_FAILED", "Profile update service is unavailable.")
  }

  const actorUserId = resolveActorUserId(authContext.user)
  if (!actorUserId) {
    return buildFailure("UNAUTHENTICATED", "Authentication is required.")
  }

  const name = normalizeRequiredName(input.name)
  if (!name) {
    return buildFailure("VALIDATION_FAILED", "Name is required.")
  }

  const phoneNumberNormalized = normalizeOptionalPhoneNumber(input.phoneNumber)
  if (phoneNumberNormalized.invalid) {
    return buildFailure("VALIDATION_FAILED", "Phone number format is invalid.")
  }

  const nationality = normalizeNullableText(input.nationality, 100)
  const renNumber = normalizeNullableText(input.renNumber, 50)
  const agencyName = normalizeNullableText(input.agencyName, 100)

  try {
    return await db.transaction(async (tx) => {
      const existingRows = await tx
        .select({
          userId: user.id,
          roleCode: roles.code,
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber,
          phoneNumberVerified: user.phoneNumberVerified,
          nationality: user.nationality,
          renNumber: user.renNumber,
          agencyName: user.agencyName,
          onboardingCompleted: user.onboardingCompleted,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        })
        .from(user)
        .leftJoin(roles, eq(user.roleId, roles.id))
        .where(eq(user.id, actorUserId))
        .limit(1)

      const existing = existingRows[0]
      if (!existing) {
        return buildFailure("PROFILE_NOT_FOUND", "Agent profile was not found.")
      }

      if (phoneNumberNormalized.value) {
        const duplicateRows = await tx
          .select({ id: user.id })
          .from(user)
          .where(and(eq(user.phoneNumber, phoneNumberNormalized.value), ne(user.id, actorUserId)))
          .limit(1)

        if (duplicateRows[0]) {
          return buildFailure("PHONE_ALREADY_USED", "Phone number is already used by another account.")
        }
      }

      const hasChanges =
        existing.name !== name ||
        existing.phoneNumber !== phoneNumberNormalized.value ||
        existing.nationality !== nationality ||
        existing.renNumber !== renNumber ||
        existing.agencyName !== agencyName

      if (!hasChanges) {
        return {
          ok: true,
          profile: mapProfile(existing),
        } satisfies UpdateAgentProfileBasicsSuccess
      }

      const updatedRows = await tx
        .update(user)
        .set({
          name,
          phoneNumber: phoneNumberNormalized.value,
          nationality,
          renNumber,
          agencyName,
          updatedAt: new Date(),
        })
        .where(eq(user.id, actorUserId))
        .returning({
          userId: user.id,
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber,
          phoneNumberVerified: user.phoneNumberVerified,
          nationality: user.nationality,
          renNumber: user.renNumber,
          agencyName: user.agencyName,
          onboardingCompleted: user.onboardingCompleted,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        })

      const updated = updatedRows[0]
      if (!updated) {
        return buildFailure("UPDATE_FAILED", "Profile update did not return an updated row.")
      }

      await tx.insert(auditLogs).values({
        actorUserId,
        actorRoleId: authContext.roleId,
        actionType: "AGENT_PROFILE_UPDATED",
        entityType: "USER",
        entityId: actorUserId,
        beforeJson: {
          name: existing.name,
          phoneNumber: existing.phoneNumber,
          nationality: existing.nationality,
          renNumber: existing.renNumber,
          agencyName: existing.agencyName,
        },
        afterJson: {
          name: updated.name,
          phoneNumber: updated.phoneNumber,
          nationality: updated.nationality,
          renNumber: updated.renNumber,
          agencyName: updated.agencyName,
        },
        changeSummary: "Agent profile basics updated",
        sourceApp: "INTERNAL_PORTAL",
      })

      return {
        ok: true,
        profile: mapProfile({
          ...updated,
          roleCode: existing.roleCode,
        }),
      } satisfies UpdateAgentProfileBasicsSuccess
    })
  } catch {
    return buildFailure("UPDATE_FAILED", "Unable to update agent profile.")
  }
}

export async function updateAgentAvailability(
  input: UpdateAgentAvailabilityInput,
): Promise<UpdateAgentAvailabilityResult> {
  await requireRole(["AGENT"], {
    nextPath: input.nextPath ?? ROUTES.agent.profile,
  })

  return {
    ok: false,
    code: "NOT_SUPPORTED",
    message:
      "Availability controls are deferred until dedicated appointment scheduling persistence is implemented.",
  }
}