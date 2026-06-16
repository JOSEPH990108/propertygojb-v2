import "server-only"

import { and, desc, eq, ilike, isNull, or, sql, type SQL } from "drizzle-orm"

import { ROUTES } from "@/config/routes"
import { db } from "@/db"
import { bookings } from "@/db/schema/bookings"
import { leadActivities, leads } from "@/db/schema/crm-leads"
import { requireRole } from "@/lib/auth/guards"

export type AgentCustomerListItem = {
  leadId: string
  fullName: string
  phone: string
  email: string | null
  status: string
  activeBookingCount: number
  lastActivityAt: string | null
  updatedAt: string
}

export type ListAgentCustomersParams = {
  search?: string
  page?: number
  pageSize?: number
  nextPath?: string
}

export type ListAgentCustomersResult = {
  customers: AgentCustomerListItem[]
  search: string
  page: number
  pageSize: number
  total: number
}

export type AgentCustomerRecentBooking = {
  id: string
  bookingCode: string
  status: string
  updatedAt: string
}

export type AgentCustomerProfile = {
  leadId: string
  fullName: string
  phone: string
  email: string | null
  status: string
  nationality: string | null
  preferredLanguage: string | null
  lastActivityAt: string | null
  updatedAt: string
  recentBookings: AgentCustomerRecentBooking[]
}

export type AgentCustomerActivityItem = {
  id: string
  activityType: string
  title: string | null
  body: string | null
  createdAt: string
}

type ListAgentCustomerActivitiesOptions = {
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

function normalizeSearch(value: unknown): string {
  if (typeof value !== "string") {
    return ""
  }

  return value.trim()
}

function normalizeLeadId(value: unknown): string | null {
  if (typeof value !== "string") {
    return null
  }

  const normalized = value.trim()
  return normalized ? normalized : null
}

function buildWhereExpression(clauses: SQL<unknown>[]): SQL<unknown> | undefined {
  if (clauses.length === 0) {
    return undefined
  }

  if (clauses.length === 1) {
    return clauses[0]
  }

  return and(...clauses)
}

export async function listAgentCustomers(
  params: ListAgentCustomersParams = {},
): Promise<ListAgentCustomersResult> {
  const authContext = await requireRole(["AGENT"], {
    nextPath: params.nextPath ?? ROUTES.agent.customers,
  })

  const search = normalizeSearch(params.search)
  const page = normalizePositiveInt(params.page, 1, 500)
  const pageSize = normalizePositiveInt(params.pageSize, 20, 100)

  if (!db) {
    return {
      customers: [],
      search,
      page,
      pageSize,
      total: 0,
    }
  }

  const actorUserId = resolveActorUserId(authContext.user)
  if (!actorUserId) {
    return {
      customers: [],
      search,
      page,
      pageSize,
      total: 0,
    }
  }

  const whereClauses: SQL<unknown>[] = [
    isNull(leads.deletedAt),
    eq(leads.currentAssigneeUserId, actorUserId),
  ]

  if (search) {
    const searchPattern = `%${search}%`
    whereClauses.push(
      or(
        ilike(leads.fullName, searchPattern),
        ilike(leads.primaryPhoneE164, searchPattern),
        ilike(leads.email, searchPattern),
      )!,
    )
  }

  const whereExpression = buildWhereExpression(whereClauses)

  const [{ total }] = await db
    .select({
      total: sql<number>`count(*)`,
    })
    .from(leads)
    .where(whereExpression)

  const rows = await db
    .select({
      leadId: leads.id,
      fullName: leads.fullName,
      phone: leads.primaryPhoneE164,
      email: leads.email,
      status: leads.currentStatus,
      activeBookingCount: sql<number>`count(${bookings.id})`,
      lastActivityAt: leads.lastActivityAt,
      updatedAt: leads.updatedAt,
    })
    .from(leads)
    .leftJoin(bookings, and(eq(bookings.leadId, leads.id), isNull(bookings.deletedAt)))
    .where(whereExpression)
    .groupBy(
      leads.id,
      leads.fullName,
      leads.primaryPhoneE164,
      leads.email,
      leads.currentStatus,
      leads.lastActivityAt,
      leads.updatedAt,
    )
    .orderBy(desc(leads.updatedAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize)

  return {
    customers: rows.map((row) => ({
      leadId: row.leadId,
      fullName: row.fullName ?? "Unknown",
      phone: row.phone,
      email: row.email,
      status: row.status,
      activeBookingCount: Number(row.activeBookingCount ?? 0),
      lastActivityAt: row.lastActivityAt ? row.lastActivityAt.toISOString() : null,
      updatedAt: row.updatedAt.toISOString(),
    })),
    search,
    page,
    pageSize,
    total: Number(total ?? 0),
  }
}

export async function getAgentCustomerProfile(
  leadId: string,
  options: { nextPath?: string } = {},
): Promise<AgentCustomerProfile | null> {
  const authContext = await requireRole(["AGENT"], {
    nextPath: options.nextPath ?? ROUTES.agent.customers,
  })

  if (!db) {
    return null
  }

  const actorUserId = resolveActorUserId(authContext.user)
  const normalizedLeadId = normalizeLeadId(leadId)
  if (!actorUserId || !normalizedLeadId) {
    return null
  }

  const leadRows = await db
    .select({
      leadId: leads.id,
      fullName: leads.fullName,
      phone: leads.primaryPhoneE164,
      email: leads.email,
      status: leads.currentStatus,
      nationality: leads.nationality,
      preferredLanguage: leads.preferredLanguage,
      lastActivityAt: leads.lastActivityAt,
      updatedAt: leads.updatedAt,
    })
    .from(leads)
    .where(
      and(
        eq(leads.id, normalizedLeadId),
        eq(leads.currentAssigneeUserId, actorUserId),
        isNull(leads.deletedAt),
      ),
    )
    .limit(1)

  const leadRow = leadRows[0]
  if (!leadRow) {
    return null
  }

  const recentBookings = await db
    .select({
      id: bookings.id,
      bookingCode: bookings.bookingCode,
      status: bookings.status,
      updatedAt: bookings.updatedAt,
    })
    .from(bookings)
    .where(and(eq(bookings.leadId, normalizedLeadId), isNull(bookings.deletedAt)))
    .orderBy(desc(bookings.updatedAt))
    .limit(5)

  return {
    leadId: leadRow.leadId,
    fullName: leadRow.fullName ?? "Unknown",
    phone: leadRow.phone,
    email: leadRow.email,
    status: leadRow.status,
    nationality: leadRow.nationality,
    preferredLanguage: leadRow.preferredLanguage,
    lastActivityAt: leadRow.lastActivityAt ? leadRow.lastActivityAt.toISOString() : null,
    updatedAt: leadRow.updatedAt.toISOString(),
    recentBookings: recentBookings.map((booking) => ({
      id: booking.id,
      bookingCode: booking.bookingCode,
      status: booking.status,
      updatedAt: booking.updatedAt.toISOString(),
    })),
  }
}

export async function listAgentCustomerActivities(
  leadId: string,
  options: ListAgentCustomerActivitiesOptions = {},
): Promise<AgentCustomerActivityItem[]> {
  const authContext = await requireRole(["AGENT"], {
    nextPath: options.nextPath ?? ROUTES.agent.customers,
  })

  if (!db) {
    return []
  }

  const actorUserId = resolveActorUserId(authContext.user)
  const normalizedLeadId = normalizeLeadId(leadId)
  if (!actorUserId || !normalizedLeadId) {
    return []
  }

  const limit = normalizePositiveInt(options.limit, 15, 100)

  const ownershipRows = await db
    .select({ id: leads.id })
    .from(leads)
    .where(
      and(
        eq(leads.id, normalizedLeadId),
        eq(leads.currentAssigneeUserId, actorUserId),
        isNull(leads.deletedAt),
      ),
    )
    .limit(1)

  if (!ownershipRows[0]) {
    return []
  }

  const rows = await db
    .select({
      id: leadActivities.id,
      activityType: leadActivities.activityType,
      title: leadActivities.title,
      body: leadActivities.body,
      createdAt: leadActivities.createdAt,
    })
    .from(leadActivities)
    .where(and(eq(leadActivities.leadId, normalizedLeadId), isNull(leadActivities.deletedAt)))
    .orderBy(desc(leadActivities.createdAt))
    .limit(limit)

  return rows.map((row) => ({
    id: row.id,
    activityType: row.activityType,
    title: row.title,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
  }))
}