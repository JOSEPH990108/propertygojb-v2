import "server-only"

import { and, asc, desc, eq, ilike, isNull, ne, or, sql, type SQL } from "drizzle-orm"

import { ROUTES } from "@/config/routes"
import { auditLogs } from "@/db/schema/audit"
import { projectLayouts, projectPhases, projects, projectTowers } from "@/db/schema/catalog"
import { db } from "@/db"
import { units } from "@/db/schema/inventory"
import { bookingStatuses, lotTypes, unitPositions } from "@/db/schema/lookups"
import { requireRole } from "@/lib/auth/guards"

export type AdminPropertyLookupOption = {
  id: string
  code: string | null
  name: string
}

export type AdminPropertyListItem = {
  id: string
  projectId: string
  projectName: string | null
  unitNo: string
  bookingStatusId: string
  bookingStatusCode: string | null
  bookingStatusName: string | null
  lotTypeId: string
  lotTypeCode: string | null
  lotTypeName: string | null
  layoutName: string | null
  phaseName: string | null
  towerName: string | null
  floor: number | null
  stack: string | null
  basePrice: string
  finalPrice: string | null
  builtUpSqft: string | null
  createdAt: string
  updatedAt: string
}

export type ListAdminPropertiesParams = {
  search?: string
  projectId?: string
  bookingStatusId?: string
  page?: number
  pageSize?: number
}

export type ListAdminPropertiesResult = {
  properties: AdminPropertyListItem[]
  search: string
  projectId: string | "ALL"
  bookingStatusId: string | "ALL"
  page: number
  pageSize: number
  total: number
  projectOptions: AdminPropertyLookupOption[]
  bookingStatusOptions: AdminPropertyLookupOption[]
}

export type AdminPropertyFormOptions = {
  projects: AdminPropertyLookupOption[]
  bookingStatuses: AdminPropertyLookupOption[]
  lotTypes: AdminPropertyLookupOption[]
  unitPositions: AdminPropertyLookupOption[]
  layouts: AdminPropertyLookupOption[]
  phases: AdminPropertyLookupOption[]
  towers: AdminPropertyLookupOption[]
}

export type AdminPropertyEditable = {
  id: string
  projectId: string
  layoutId: string | null
  towerId: string | null
  phaseId: string | null
  unitNo: string
  floor: number | null
  stack: string | null
  streetName: string | null
  displaySequence: number
  builtUpSqft: string | null
  landAreaSqft: string | null
  dimensionText: string | null
  facing: string | null
  positionTypeId: string | null
  carparkCount: number
  carparkLotNo: string | null
  carparkType: string | null
  lotTypeId: string
  bookingStatusId: string
  basePrice: string
  finalPrice: string | null
  createdAt: string
  updatedAt: string
}

export type PropertyFieldErrors = Partial<Record<string, string>>

export type AdminPropertyMutationFailureCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "VALIDATION_FAILED"
  | "PROPERTY_NOT_FOUND"
  | "LOOKUP_NOT_FOUND"
  | "UNIT_NO_ALREADY_EXISTS"
  | "CREATE_FAILED"
  | "UPDATE_FAILED"
  | "ARCHIVE_FAILED"

export type AdminPropertyMutationSuccess = {
  ok: true
  propertyId: string
}

export type AdminPropertyMutationFailure = {
  ok: false
  code: AdminPropertyMutationFailureCode
  message: string
  fieldErrors?: PropertyFieldErrors
}

export type AdminPropertyMutationResult =
  | AdminPropertyMutationSuccess
  | AdminPropertyMutationFailure

export type GetAdminPropertyByIdResult =
  | {
      ok: true
      property: AdminPropertyEditable
    }
  | {
      ok: false
      code: "VALIDATION_FAILED" | "PROPERTY_NOT_FOUND"
      message: string
      fieldErrors?: PropertyFieldErrors
    }

export type AdminPropertyMutationInput = {
  propertyId?: unknown
  projectId?: unknown
  layoutId?: unknown
  towerId?: unknown
  phaseId?: unknown
  unitNo?: unknown
  floor?: unknown
  stack?: unknown
  streetName?: unknown
  displaySequence?: unknown
  builtUpSqft?: unknown
  landAreaSqft?: unknown
  dimensionText?: unknown
  facing?: unknown
  positionTypeId?: unknown
  carparkCount?: unknown
  carparkLotNo?: unknown
  carparkType?: unknown
  lotTypeId?: unknown
  bookingStatusId?: unknown
  basePrice?: unknown
  finalPrice?: unknown
  reasonNote?: unknown
}

export type ArchiveAdminPropertyInput = {
  propertyId: unknown
  reasonNote?: unknown
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

function normalizeTextFilter(value?: string): string {
  if (!value) {
    return "ALL"
  }

  const normalized = value.trim()
  return normalized ? normalized : "ALL"
}

function resolveActorUserId(value: unknown): string | null {
  if (!value || typeof value !== "object") {
    return null
  }

  const candidate = (value as { id?: unknown }).id
  return typeof candidate === "string" && candidate ? candidate : null
}

function normalizeRequiredId(value: unknown): string | null {
  if (typeof value !== "string") {
    return null
  }

  const normalized = value.trim()
  return normalized ? normalized : null
}

function normalizeOptionalId(value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined
  }

  if (value === null) {
    return null
  }

  if (typeof value !== "string") {
    return undefined
  }

  const normalized = value.trim()
  return normalized ? normalized : null
}

function normalizeRequiredText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null
  }

  const normalized = value.trim()
  return normalized ? normalized : null
}

function normalizeOptionalText(value: unknown, maxLength: number): string | null | undefined {
  if (value === undefined) {
    return undefined
  }

  if (value === null) {
    return null
  }

  if (typeof value !== "string") {
    return undefined
  }

  const normalized = value.trim()
  if (!normalized) {
    return null
  }

  if (normalized.length <= maxLength) {
    return normalized
  }

  return normalized.slice(0, maxLength)
}

function normalizeOptionalInteger(
  value: unknown,
  field: string,
  fieldErrors: PropertyFieldErrors,
  min: number,
): number | null | undefined {
  if (value === undefined) {
    return undefined
  }

  const raw = typeof value === "number" ? String(value) : typeof value === "string" ? value : null
  if (raw === null) {
    fieldErrors[field] = `${field} must be an integer.`
    return undefined
  }

  const normalized = raw.trim()
  if (!normalized) {
    return null
  }

  const parsed = Number(normalized)
  if (!Number.isInteger(parsed)) {
    fieldErrors[field] = `${field} must be an integer.`
    return undefined
  }

  if (parsed < min) {
    fieldErrors[field] = `${field} must be ${min} or greater.`
    return undefined
  }

  return parsed
}

function normalizeRequiredDecimal(
  value: unknown,
  field: string,
  fieldErrors: PropertyFieldErrors,
  min: number,
): string | null {
  const raw = typeof value === "number" ? String(value) : typeof value === "string" ? value : null

  if (raw === null) {
    fieldErrors[field] = `${field} is required.`
    return null
  }

  const normalized = raw.trim()
  if (!normalized) {
    fieldErrors[field] = `${field} is required.`
    return null
  }

  const parsed = Number(normalized)
  if (!Number.isFinite(parsed)) {
    fieldErrors[field] = `${field} must be a valid number.`
    return null
  }

  if (parsed < min) {
    fieldErrors[field] = `${field} must be ${min} or greater.`
    return null
  }

  return normalized
}

function normalizeOptionalDecimal(
  value: unknown,
  field: string,
  fieldErrors: PropertyFieldErrors,
  min: number,
): string | null | undefined {
  if (value === undefined) {
    return undefined
  }

  if (value === null) {
    return null
  }

  const raw = typeof value === "number" ? String(value) : typeof value === "string" ? value : null
  if (raw === null) {
    fieldErrors[field] = `${field} must be a valid number.`
    return undefined
  }

  const normalized = raw.trim()
  if (!normalized) {
    return null
  }

  const parsed = Number(normalized)
  if (!Number.isFinite(parsed)) {
    fieldErrors[field] = `${field} must be a valid number.`
    return undefined
  }

  if (parsed < min) {
    fieldErrors[field] = `${field} must be ${min} or greater.`
    return undefined
  }

  return normalized
}

function buildFailure(
  code: AdminPropertyMutationFailureCode,
  message: string,
  fieldErrors?: PropertyFieldErrors,
): AdminPropertyMutationFailure {
  return {
    ok: false,
    code,
    message,
    fieldErrors,
  }
}

async function resolveProjectExists(projectId: string): Promise<boolean> {
  if (!db) {
    return false
  }

  const rows = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.isActive, true), isNull(projects.deletedAt)))
    .limit(1)

  return Boolean(rows[0])
}

async function resolveLayoutExists(layoutId: string, projectId: string): Promise<boolean> {
  if (!db) {
    return false
  }

  const rows = await db
    .select({ id: projectLayouts.id })
    .from(projectLayouts)
    .where(
      and(
        eq(projectLayouts.id, layoutId),
        eq(projectLayouts.projectId, projectId),
        isNull(projectLayouts.deletedAt),
      ),
    )
    .limit(1)

  return Boolean(rows[0])
}

async function resolvePhaseExists(phaseId: string, projectId: string): Promise<boolean> {
  if (!db) {
    return false
  }

  const rows = await db
    .select({ id: projectPhases.id })
    .from(projectPhases)
    .where(
      and(
        eq(projectPhases.id, phaseId),
        eq(projectPhases.projectId, projectId),
        isNull(projectPhases.deletedAt),
      ),
    )
    .limit(1)

  return Boolean(rows[0])
}

async function resolveTowerExists(towerId: string, projectId: string): Promise<boolean> {
  if (!db) {
    return false
  }

  const rows = await db
    .select({ id: projectTowers.id })
    .from(projectTowers)
    .where(
      and(
        eq(projectTowers.id, towerId),
        eq(projectTowers.projectId, projectId),
        isNull(projectTowers.deletedAt),
      ),
    )
    .limit(1)

  return Boolean(rows[0])
}

async function resolveLotTypeExists(lotTypeId: string): Promise<boolean> {
  if (!db) {
    return false
  }

  const rows = await db
    .select({ id: lotTypes.id })
    .from(lotTypes)
    .where(and(eq(lotTypes.id, lotTypeId), eq(lotTypes.isActive, true), isNull(lotTypes.deletedAt)))
    .limit(1)

  return Boolean(rows[0])
}

async function resolveBookingStatusExists(bookingStatusId: string): Promise<boolean> {
  if (!db) {
    return false
  }

  const rows = await db
    .select({ id: bookingStatuses.id })
    .from(bookingStatuses)
    .where(
      and(
        eq(bookingStatuses.id, bookingStatusId),
        eq(bookingStatuses.isActive, true),
        isNull(bookingStatuses.deletedAt),
      ),
    )
    .limit(1)

  return Boolean(rows[0])
}

async function resolveUnitPositionExists(positionTypeId: string): Promise<boolean> {
  if (!db) {
    return false
  }

  const rows = await db
    .select({ id: unitPositions.id })
    .from(unitPositions)
    .where(and(eq(unitPositions.id, positionTypeId), eq(unitPositions.isActive, true), isNull(unitPositions.deletedAt)))
    .limit(1)

  return Boolean(rows[0])
}

async function resolveUnitNoConflict(input: {
  projectId: string
  unitNo: string
  excludeId?: string
}): Promise<boolean> {
  if (!db) {
    return false
  }

  const whereClauses: SQL<unknown>[] = [
    eq(units.projectId, input.projectId),
    eq(units.unitNo, input.unitNo),
  ]

  if (input.excludeId) {
    whereClauses.push(ne(units.id, input.excludeId))
  }

  const rows = await db
    .select({ id: units.id })
    .from(units)
    .where(and(...whereClauses))
    .limit(1)

  return Boolean(rows[0])
}

export async function listAdminProperties(
  params: ListAdminPropertiesParams = {},
): Promise<ListAdminPropertiesResult> {
  await requireRole(["ADMIN", "SUPER_ADMIN"], {
    nextPath: ROUTES.admin.properties,
  })

  if (!db) {
    return {
      properties: [],
      search: "",
      projectId: "ALL",
      bookingStatusId: "ALL",
      page: 1,
      pageSize: 20,
      total: 0,
      projectOptions: [],
      bookingStatusOptions: [],
    }
  }

  const search = typeof params.search === "string" ? params.search.trim() : ""
  const projectId = normalizeTextFilter(params.projectId)
  const bookingStatusId = normalizeTextFilter(params.bookingStatusId)
  const page = normalizePositiveInt(params.page, 1, 500)
  const pageSize = normalizePositiveInt(params.pageSize, 20, 100)

  const whereClauses: SQL<unknown>[] = [isNull(units.deletedAt)]

  if (search) {
    const searchPattern = `%${search}%`
    whereClauses.push(
      or(
        ilike(units.unitNo, searchPattern),
        ilike(units.stack, searchPattern),
        ilike(units.streetName, searchPattern),
        ilike(projects.name, searchPattern),
      )!,
    )
  }

  if (projectId !== "ALL") {
    whereClauses.push(eq(units.projectId, projectId))
  }

  if (bookingStatusId !== "ALL") {
    whereClauses.push(eq(units.bookingStatusId, bookingStatusId))
  }

  const whereExpression = whereClauses.length === 1 ? whereClauses[0] : and(...whereClauses)

  const [{ total }] = await db
    .select({
      total: sql<number>`count(*)`,
    })
    .from(units)
    .leftJoin(projects, eq(units.projectId, projects.id))
    .where(whereExpression)

  const rows = await db
    .select({
      id: units.id,
      projectId: units.projectId,
      projectName: projects.name,
      unitNo: units.unitNo,
      bookingStatusId: units.bookingStatusId,
      bookingStatusCode: bookingStatuses.code,
      bookingStatusName: bookingStatuses.name,
      lotTypeId: units.lotTypeId,
      lotTypeCode: lotTypes.code,
      lotTypeName: lotTypes.name,
      layoutName: projectLayouts.name,
      phaseName: projectPhases.name,
      towerName: projectTowers.name,
      floor: units.floor,
      stack: units.stack,
      basePrice: units.basePrice,
      finalPrice: units.finalPrice,
      builtUpSqft: units.builtUpSqft,
      createdAt: units.createdAt,
      updatedAt: units.updatedAt,
    })
    .from(units)
    .leftJoin(projects, eq(units.projectId, projects.id))
    .leftJoin(bookingStatuses, eq(units.bookingStatusId, bookingStatuses.id))
    .leftJoin(lotTypes, eq(units.lotTypeId, lotTypes.id))
    .leftJoin(projectLayouts, eq(units.layoutId, projectLayouts.id))
    .leftJoin(projectPhases, eq(units.phaseId, projectPhases.id))
    .leftJoin(projectTowers, eq(units.towerId, projectTowers.id))
    .where(whereExpression)
    .orderBy(desc(units.updatedAt), asc(units.unitNo))
    .limit(pageSize)
    .offset((page - 1) * pageSize)

  const [projectOptionRows, statusOptionRows] = await Promise.all([
    db
      .select({
        id: projects.id,
        code: projects.slug,
        name: projects.name,
      })
      .from(projects)
      .where(and(eq(projects.isActive, true), isNull(projects.deletedAt)))
      .orderBy(asc(projects.name)),
    db
      .select({
        id: bookingStatuses.id,
        code: bookingStatuses.code,
        name: bookingStatuses.name,
      })
      .from(bookingStatuses)
      .where(and(eq(bookingStatuses.isActive, true), isNull(bookingStatuses.deletedAt)))
      .orderBy(asc(bookingStatuses.sortOrder), asc(bookingStatuses.name)),
  ])

  return {
    properties: rows.map((row) => ({
      id: row.id,
      projectId: row.projectId,
      projectName: row.projectName,
      unitNo: row.unitNo,
      bookingStatusId: row.bookingStatusId,
      bookingStatusCode: row.bookingStatusCode,
      bookingStatusName: row.bookingStatusName,
      lotTypeId: row.lotTypeId,
      lotTypeCode: row.lotTypeCode,
      lotTypeName: row.lotTypeName,
      layoutName: row.layoutName,
      phaseName: row.phaseName,
      towerName: row.towerName,
      floor: row.floor,
      stack: row.stack,
      basePrice: row.basePrice,
      finalPrice: row.finalPrice,
      builtUpSqft: row.builtUpSqft,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })),
    search,
    projectId,
    bookingStatusId,
    page,
    pageSize,
    total: Number(total ?? 0),
    projectOptions: projectOptionRows.map((row) => ({
      id: row.id,
      code: row.code,
      name: row.name,
    })),
    bookingStatusOptions: statusOptionRows.map((row) => ({
      id: row.id,
      code: row.code,
      name: row.name,
    })),
  }
}

export async function getAdminPropertyFormOptions(): Promise<AdminPropertyFormOptions> {
  await requireRole(["ADMIN", "SUPER_ADMIN"], {
    nextPath: ROUTES.admin.properties,
  })

  if (!db) {
    return {
      projects: [],
      bookingStatuses: [],
      lotTypes: [],
      unitPositions: [],
      layouts: [],
      phases: [],
      towers: [],
    }
  }

  const [projectRows, bookingStatusRows, lotTypeRows, unitPositionRows, layoutRows, phaseRows, towerRows] =
    await Promise.all([
      db
        .select({ id: projects.id, code: projects.slug, name: projects.name })
        .from(projects)
        .where(and(eq(projects.isActive, true), isNull(projects.deletedAt)))
        .orderBy(asc(projects.name)),
      db
        .select({ id: bookingStatuses.id, code: bookingStatuses.code, name: bookingStatuses.name })
        .from(bookingStatuses)
        .where(and(eq(bookingStatuses.isActive, true), isNull(bookingStatuses.deletedAt)))
        .orderBy(asc(bookingStatuses.sortOrder), asc(bookingStatuses.name)),
      db
        .select({ id: lotTypes.id, code: lotTypes.code, name: lotTypes.name })
        .from(lotTypes)
        .where(and(eq(lotTypes.isActive, true), isNull(lotTypes.deletedAt)))
        .orderBy(asc(lotTypes.sortOrder), asc(lotTypes.name)),
      db
        .select({ id: unitPositions.id, code: unitPositions.code, name: unitPositions.name })
        .from(unitPositions)
        .where(and(eq(unitPositions.isActive, true), isNull(unitPositions.deletedAt)))
        .orderBy(asc(unitPositions.sortOrder), asc(unitPositions.name)),
      db
        .select({ id: projectLayouts.id, code: projectLayouts.code, name: projectLayouts.name })
        .from(projectLayouts)
        .where(isNull(projectLayouts.deletedAt))
        .orderBy(asc(projectLayouts.name)),
      db
        .select({ id: projectPhases.id, code: projectPhases.phaseCode, name: projectPhases.name })
        .from(projectPhases)
        .where(isNull(projectPhases.deletedAt))
        .orderBy(asc(projectPhases.name)),
      db
        .select({ id: projectTowers.id, code: projectTowers.towerNumber, name: projectTowers.name })
        .from(projectTowers)
        .where(isNull(projectTowers.deletedAt))
        .orderBy(asc(projectTowers.name)),
    ])

  return {
    projects: projectRows,
    bookingStatuses: bookingStatusRows,
    lotTypes: lotTypeRows,
    unitPositions: unitPositionRows,
    layouts: layoutRows.map((row) => ({ id: row.id, code: row.code ?? null, name: row.name ?? row.code ?? row.id })),
    phases: phaseRows.map((row) => ({ id: row.id, code: row.code ?? null, name: row.name })),
    towers: towerRows.map((row) => ({ id: row.id, code: row.code ?? null, name: row.name ?? row.code ?? row.id })),
  }
}

export async function getAdminPropertyById(propertyId: string): Promise<GetAdminPropertyByIdResult> {
  await requireRole(["ADMIN", "SUPER_ADMIN"], {
    nextPath: ROUTES.admin.properties,
  })

  const normalizedPropertyId = normalizeRequiredId(propertyId)
  if (!normalizedPropertyId) {
    return {
      ok: false,
      code: "VALIDATION_FAILED",
      message: "Property id is required.",
      fieldErrors: {
        propertyId: "Property id is required.",
      },
    }
  }

  if (!db) {
    return {
      ok: false,
      code: "PROPERTY_NOT_FOUND",
      message: "Property was not found.",
    }
  }

  const rows = await db
    .select({
      id: units.id,
      projectId: units.projectId,
      layoutId: units.layoutId,
      towerId: units.towerId,
      phaseId: units.phaseId,
      unitNo: units.unitNo,
      floor: units.floor,
      stack: units.stack,
      streetName: units.streetName,
      displaySequence: units.displaySequence,
      builtUpSqft: units.builtUpSqft,
      landAreaSqft: units.landAreaSqft,
      dimensionText: units.dimensionText,
      facing: units.facing,
      positionTypeId: units.positionTypeId,
      carparkCount: units.carparkCount,
      carparkLotNo: units.carparkLotNo,
      carparkType: units.carparkType,
      lotTypeId: units.lotTypeId,
      bookingStatusId: units.bookingStatusId,
      basePrice: units.basePrice,
      finalPrice: units.finalPrice,
      createdAt: units.createdAt,
      updatedAt: units.updatedAt,
    })
    .from(units)
    .where(and(eq(units.id, normalizedPropertyId), isNull(units.deletedAt)))
    .limit(1)

  const row = rows[0]
  if (!row) {
    return {
      ok: false,
      code: "PROPERTY_NOT_FOUND",
      message: "Property was not found.",
    }
  }

  return {
    ok: true,
    property: {
      id: row.id,
      projectId: row.projectId,
      layoutId: row.layoutId,
      towerId: row.towerId,
      phaseId: row.phaseId,
      unitNo: row.unitNo,
      floor: row.floor,
      stack: row.stack,
      streetName: row.streetName,
      displaySequence: row.displaySequence,
      builtUpSqft: row.builtUpSqft,
      landAreaSqft: row.landAreaSqft,
      dimensionText: row.dimensionText,
      facing: row.facing,
      positionTypeId: row.positionTypeId,
      carparkCount: row.carparkCount,
      carparkLotNo: row.carparkLotNo,
      carparkType: row.carparkType,
      lotTypeId: row.lotTypeId,
      bookingStatusId: row.bookingStatusId,
      basePrice: row.basePrice,
      finalPrice: row.finalPrice,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    },
  }
}

export async function createAdminProperty(
  input: AdminPropertyMutationInput,
): Promise<AdminPropertyMutationResult> {
  const authContext = await requireRole(["ADMIN", "SUPER_ADMIN"], {
    nextPath: ROUTES.admin.properties,
  })

  const actorUserId = resolveActorUserId(authContext.user)
  if (!actorUserId) {
    return buildFailure("UNAUTHENTICATED", "Authentication is required.")
  }

  if (!db) {
    return buildFailure("FORBIDDEN", "Property service is unavailable.")
  }

  const fieldErrors: PropertyFieldErrors = {}

  const projectId = normalizeRequiredId(input.projectId)
  if (!projectId) {
    fieldErrors.projectId = "Project is required."
  }

  const unitNo = normalizeRequiredText(input.unitNo)
  if (!unitNo) {
    fieldErrors.unitNo = "Unit number is required."
  }

  const lotTypeId = normalizeRequiredId(input.lotTypeId)
  if (!lotTypeId) {
    fieldErrors.lotTypeId = "Lot type is required."
  }

  const bookingStatusId = normalizeRequiredId(input.bookingStatusId)
  if (!bookingStatusId) {
    fieldErrors.bookingStatusId = "Booking status is required."
  }

  const basePrice = normalizeRequiredDecimal(input.basePrice, "basePrice", fieldErrors, 0)

  const floor = normalizeOptionalInteger(input.floor, "floor", fieldErrors, 0)
  const displaySequence = normalizeOptionalInteger(input.displaySequence, "displaySequence", fieldErrors, 0)
  const carparkCount = normalizeOptionalInteger(input.carparkCount, "carparkCount", fieldErrors, 0)

  const finalPrice = normalizeOptionalDecimal(input.finalPrice, "finalPrice", fieldErrors, 0)
  const builtUpSqft = normalizeOptionalDecimal(input.builtUpSqft, "builtUpSqft", fieldErrors, 0)
  const landAreaSqft = normalizeOptionalDecimal(input.landAreaSqft, "landAreaSqft", fieldErrors, 0)

  const layoutId = normalizeOptionalId(input.layoutId)
  const towerId = normalizeOptionalId(input.towerId)
  const phaseId = normalizeOptionalId(input.phaseId)
  const positionTypeId = normalizeOptionalId(input.positionTypeId)

  const stack = normalizeOptionalText(input.stack, 10)
  const streetName = normalizeOptionalText(input.streetName, 100)
  const dimensionText = normalizeOptionalText(input.dimensionText, 50)
  const facing = normalizeOptionalText(input.facing, 100)
  const carparkLotNo = normalizeOptionalText(input.carparkLotNo, 100)
  const carparkType = normalizeOptionalText(input.carparkType, 50)
  const reasonNote = normalizeOptionalText(input.reasonNote, 500)

  if (layoutId === undefined && input.layoutId !== undefined) {
    fieldErrors.layoutId = "Layout is invalid."
  }

  if (towerId === undefined && input.towerId !== undefined) {
    fieldErrors.towerId = "Tower is invalid."
  }

  if (phaseId === undefined && input.phaseId !== undefined) {
    fieldErrors.phaseId = "Phase is invalid."
  }

  if (positionTypeId === undefined && input.positionTypeId !== undefined) {
    fieldErrors.positionTypeId = "Position type is invalid."
  }

  if (Object.keys(fieldErrors).length > 0) {
    return buildFailure("VALIDATION_FAILED", "Property payload is invalid.", fieldErrors)
  }

  if (!projectId || !unitNo || !lotTypeId || !bookingStatusId || !basePrice) {
    return buildFailure("VALIDATION_FAILED", "Property payload is invalid.", fieldErrors)
  }

  if (!(await resolveProjectExists(projectId))) {
    return buildFailure("LOOKUP_NOT_FOUND", "Project was not found.", {
      projectId: "Project was not found.",
    })
  }

  if (layoutId && !(await resolveLayoutExists(layoutId, projectId))) {
    return buildFailure("LOOKUP_NOT_FOUND", "Layout was not found.", {
      layoutId: "Layout was not found.",
    })
  }

  if (phaseId && !(await resolvePhaseExists(phaseId, projectId))) {
    return buildFailure("LOOKUP_NOT_FOUND", "Phase was not found.", {
      phaseId: "Phase was not found.",
    })
  }

  if (towerId && !(await resolveTowerExists(towerId, projectId))) {
    return buildFailure("LOOKUP_NOT_FOUND", "Tower was not found.", {
      towerId: "Tower was not found.",
    })
  }

  if (!(await resolveLotTypeExists(lotTypeId))) {
    return buildFailure("LOOKUP_NOT_FOUND", "Lot type was not found.", {
      lotTypeId: "Lot type was not found.",
    })
  }

  if (!(await resolveBookingStatusExists(bookingStatusId))) {
    return buildFailure("LOOKUP_NOT_FOUND", "Booking status was not found.", {
      bookingStatusId: "Booking status was not found.",
    })
  }

  if (positionTypeId && !(await resolveUnitPositionExists(positionTypeId))) {
    return buildFailure("LOOKUP_NOT_FOUND", "Position type was not found.", {
      positionTypeId: "Position type was not found.",
    })
  }

  if (await resolveUnitNoConflict({ projectId, unitNo })) {
    return buildFailure("UNIT_NO_ALREADY_EXISTS", "Unit number already exists for this project.", {
      unitNo: "Unit number already exists for this project.",
    })
  }

  try {
    return await db.transaction(async (tx) => {
      const insertedRows = await tx
        .insert(units)
        .values({
          projectId,
          layoutId: layoutId ?? null,
          towerId: towerId ?? null,
          phaseId: phaseId ?? null,
          unitNo,
          floor: floor ?? null,
          stack: stack ?? null,
          streetName: streetName ?? null,
          displaySequence: displaySequence ?? 0,
          builtUpSqft: builtUpSqft ?? null,
          landAreaSqft: landAreaSqft ?? null,
          dimensionText: dimensionText ?? null,
          facing: facing ?? null,
          positionTypeId: positionTypeId ?? null,
          carparkCount: carparkCount ?? 1,
          carparkLotNo: carparkLotNo ?? null,
          carparkType: carparkType ?? null,
          lotTypeId,
          bookingStatusId,
          basePrice,
          finalPrice: finalPrice ?? null,
        })
        .returning({
          id: units.id,
          projectId: units.projectId,
          unitNo: units.unitNo,
          bookingStatusId: units.bookingStatusId,
          lotTypeId: units.lotTypeId,
          basePrice: units.basePrice,
          finalPrice: units.finalPrice,
        })

      const inserted = insertedRows[0]
      if (!inserted) {
        return buildFailure("CREATE_FAILED", "Property could not be created.")
      }

      await tx.insert(auditLogs).values({
        actorUserId,
        actorRoleId: authContext.roleId,
        actionType: "PROPERTY_CREATED",
        entityType: "PROPERTY",
        entityId: inserted.id,
        beforeJson: null,
        afterJson: {
          propertyId: inserted.id,
          projectId: inserted.projectId,
          unitNo: inserted.unitNo,
          bookingStatusId: inserted.bookingStatusId,
          lotTypeId: inserted.lotTypeId,
          basePrice: inserted.basePrice,
          finalPrice: inserted.finalPrice,
        },
        changeSummary: `Property ${inserted.unitNo} created.`,
        sourceApp: "ADMIN_PORTAL",
        metadata: {
          eventType: "PROPERTY_CREATED",
          actorUserId,
          propertyId: inserted.id,
          reasonNote,
        },
      })

      return {
        ok: true,
        propertyId: inserted.id,
      }
    })
  } catch {
    return buildFailure("CREATE_FAILED", "Property could not be created.")
  }
}

export async function updateAdminProperty(
  input: AdminPropertyMutationInput,
): Promise<AdminPropertyMutationResult> {
  const authContext = await requireRole(["ADMIN", "SUPER_ADMIN"], {
    nextPath: ROUTES.admin.properties,
  })

  const actorUserId = resolveActorUserId(authContext.user)
  if (!actorUserId) {
    return buildFailure("UNAUTHENTICATED", "Authentication is required.")
  }

  if (!db) {
    return buildFailure("FORBIDDEN", "Property service is unavailable.")
  }

  const propertyId = normalizeRequiredId(input.propertyId)
  if (!propertyId) {
    return buildFailure("VALIDATION_FAILED", "Property id is required.", {
      propertyId: "Property id is required.",
    })
  }

  const currentRows = await db
    .select({
      id: units.id,
      projectId: units.projectId,
      layoutId: units.layoutId,
      towerId: units.towerId,
      phaseId: units.phaseId,
      unitNo: units.unitNo,
      floor: units.floor,
      stack: units.stack,
      streetName: units.streetName,
      displaySequence: units.displaySequence,
      builtUpSqft: units.builtUpSqft,
      landAreaSqft: units.landAreaSqft,
      dimensionText: units.dimensionText,
      facing: units.facing,
      positionTypeId: units.positionTypeId,
      carparkCount: units.carparkCount,
      carparkLotNo: units.carparkLotNo,
      carparkType: units.carparkType,
      lotTypeId: units.lotTypeId,
      bookingStatusId: units.bookingStatusId,
      basePrice: units.basePrice,
      finalPrice: units.finalPrice,
    })
    .from(units)
    .where(and(eq(units.id, propertyId), isNull(units.deletedAt)))
    .limit(1)

  const current = currentRows[0]
  if (!current) {
    return buildFailure("PROPERTY_NOT_FOUND", "Property was not found.")
  }

  const fieldErrors: PropertyFieldErrors = {}

  const nextProjectId = normalizeOptionalId(input.projectId)
  const nextLayoutId = normalizeOptionalId(input.layoutId)
  const nextTowerId = normalizeOptionalId(input.towerId)
  const nextPhaseId = normalizeOptionalId(input.phaseId)
  const nextUnitNo = normalizeOptionalText(input.unitNo, 50)

  const nextFloor = normalizeOptionalInteger(input.floor, "floor", fieldErrors, 0)
  const nextDisplaySequence = normalizeOptionalInteger(input.displaySequence, "displaySequence", fieldErrors, 0)
  const nextCarparkCount = normalizeOptionalInteger(input.carparkCount, "carparkCount", fieldErrors, 0)

  const nextBuiltUpSqft = normalizeOptionalDecimal(input.builtUpSqft, "builtUpSqft", fieldErrors, 0)
  const nextLandAreaSqft = normalizeOptionalDecimal(input.landAreaSqft, "landAreaSqft", fieldErrors, 0)
  const nextBasePrice = normalizeOptionalDecimal(input.basePrice, "basePrice", fieldErrors, 0)
  const nextFinalPrice = normalizeOptionalDecimal(input.finalPrice, "finalPrice", fieldErrors, 0)

  const nextStack = normalizeOptionalText(input.stack, 10)
  const nextStreetName = normalizeOptionalText(input.streetName, 100)
  const nextDimensionText = normalizeOptionalText(input.dimensionText, 50)
  const nextFacing = normalizeOptionalText(input.facing, 100)
  const nextPositionTypeId = normalizeOptionalId(input.positionTypeId)
  const nextCarparkLotNo = normalizeOptionalText(input.carparkLotNo, 100)
  const nextCarparkType = normalizeOptionalText(input.carparkType, 50)
  const nextLotTypeId = normalizeOptionalId(input.lotTypeId)
  const nextBookingStatusId = normalizeOptionalId(input.bookingStatusId)
  const reasonNote = normalizeOptionalText(input.reasonNote, 500)

  if (nextProjectId === undefined && input.projectId !== undefined) {
    fieldErrors.projectId = "Project is invalid."
  }

  if (nextLayoutId === undefined && input.layoutId !== undefined) {
    fieldErrors.layoutId = "Layout is invalid."
  }

  if (nextTowerId === undefined && input.towerId !== undefined) {
    fieldErrors.towerId = "Tower is invalid."
  }

  if (nextPhaseId === undefined && input.phaseId !== undefined) {
    fieldErrors.phaseId = "Phase is invalid."
  }

  if (nextPositionTypeId === undefined && input.positionTypeId !== undefined) {
    fieldErrors.positionTypeId = "Position type is invalid."
  }

  if (nextLotTypeId === undefined && input.lotTypeId !== undefined) {
    fieldErrors.lotTypeId = "Lot type is invalid."
  }

  if (nextBookingStatusId === undefined && input.bookingStatusId !== undefined) {
    fieldErrors.bookingStatusId = "Booking status is invalid."
  }

  if (Object.keys(fieldErrors).length > 0) {
    return buildFailure("VALIDATION_FAILED", "Property payload is invalid.", fieldErrors)
  }

  const finalProjectId = nextProjectId ?? current.projectId

  if (!(await resolveProjectExists(finalProjectId))) {
    return buildFailure("LOOKUP_NOT_FOUND", "Project was not found.", {
      projectId: "Project was not found.",
    })
  }

  if (nextLayoutId !== undefined && nextLayoutId !== null && !(await resolveLayoutExists(nextLayoutId, finalProjectId))) {
    return buildFailure("LOOKUP_NOT_FOUND", "Layout was not found.", {
      layoutId: "Layout was not found.",
    })
  }

  if (nextPhaseId !== undefined && nextPhaseId !== null && !(await resolvePhaseExists(nextPhaseId, finalProjectId))) {
    return buildFailure("LOOKUP_NOT_FOUND", "Phase was not found.", {
      phaseId: "Phase was not found.",
    })
  }

  if (nextTowerId !== undefined && nextTowerId !== null && !(await resolveTowerExists(nextTowerId, finalProjectId))) {
    return buildFailure("LOOKUP_NOT_FOUND", "Tower was not found.", {
      towerId: "Tower was not found.",
    })
  }

  if (nextLotTypeId !== undefined && nextLotTypeId !== null && !(await resolveLotTypeExists(nextLotTypeId))) {
    return buildFailure("LOOKUP_NOT_FOUND", "Lot type was not found.", {
      lotTypeId: "Lot type was not found.",
    })
  }

  if (
    nextBookingStatusId !== undefined &&
    nextBookingStatusId !== null &&
    !(await resolveBookingStatusExists(nextBookingStatusId))
  ) {
    return buildFailure("LOOKUP_NOT_FOUND", "Booking status was not found.", {
      bookingStatusId: "Booking status was not found.",
    })
  }

  if (
    nextPositionTypeId !== undefined &&
    nextPositionTypeId !== null &&
    !(await resolveUnitPositionExists(nextPositionTypeId))
  ) {
    return buildFailure("LOOKUP_NOT_FOUND", "Position type was not found.", {
      positionTypeId: "Position type was not found.",
    })
  }

  const finalUnitNo = nextUnitNo ?? current.unitNo
  if (await resolveUnitNoConflict({ projectId: finalProjectId, unitNo: finalUnitNo, excludeId: propertyId })) {
    return buildFailure("UNIT_NO_ALREADY_EXISTS", "Unit number already exists for this project.", {
      unitNo: "Unit number already exists for this project.",
    })
  }

  const updatePayload: Partial<typeof units.$inferInsert> = {}

  if (nextProjectId !== undefined && nextProjectId !== null) {
    updatePayload.projectId = nextProjectId
  }

  if (nextLayoutId !== undefined) {
    updatePayload.layoutId = nextLayoutId
  }

  if (nextTowerId !== undefined) {
    updatePayload.towerId = nextTowerId
  }

  if (nextPhaseId !== undefined) {
    updatePayload.phaseId = nextPhaseId
  }

  if (nextUnitNo !== undefined) {
    updatePayload.unitNo = nextUnitNo ?? current.unitNo
  }

  if (nextFloor !== undefined) {
    updatePayload.floor = nextFloor
  }

  if (nextStack !== undefined) {
    updatePayload.stack = nextStack
  }

  if (nextStreetName !== undefined) {
    updatePayload.streetName = nextStreetName
  }

  if (nextDisplaySequence !== undefined) {
    updatePayload.displaySequence = nextDisplaySequence ?? 0
  }

  if (nextBuiltUpSqft !== undefined) {
    updatePayload.builtUpSqft = nextBuiltUpSqft
  }

  if (nextLandAreaSqft !== undefined) {
    updatePayload.landAreaSqft = nextLandAreaSqft
  }

  if (nextDimensionText !== undefined) {
    updatePayload.dimensionText = nextDimensionText
  }

  if (nextFacing !== undefined) {
    updatePayload.facing = nextFacing
  }

  if (nextPositionTypeId !== undefined) {
    updatePayload.positionTypeId = nextPositionTypeId
  }

  if (nextCarparkCount !== undefined) {
    updatePayload.carparkCount = nextCarparkCount ?? 0
  }

  if (nextCarparkLotNo !== undefined) {
    updatePayload.carparkLotNo = nextCarparkLotNo
  }

  if (nextCarparkType !== undefined) {
    updatePayload.carparkType = nextCarparkType
  }

  if (nextLotTypeId !== undefined && nextLotTypeId !== null) {
    updatePayload.lotTypeId = nextLotTypeId
  }

  if (nextBookingStatusId !== undefined && nextBookingStatusId !== null) {
    updatePayload.bookingStatusId = nextBookingStatusId
  }

  if (nextBasePrice !== undefined && nextBasePrice !== null) {
    updatePayload.basePrice = nextBasePrice
  }

  if (nextFinalPrice !== undefined) {
    updatePayload.finalPrice = nextFinalPrice
  }

  if (Object.keys(updatePayload).length === 0) {
    return buildFailure("VALIDATION_FAILED", "Provide at least one field to update.", {
      form: "Provide at least one field to update.",
    })
  }

  try {
    return await db.transaction(async (tx) => {
      const updatedRows = await tx
        .update(units)
        .set(updatePayload)
        .where(eq(units.id, propertyId))
        .returning({
          id: units.id,
          projectId: units.projectId,
          unitNo: units.unitNo,
          bookingStatusId: units.bookingStatusId,
          lotTypeId: units.lotTypeId,
          basePrice: units.basePrice,
          finalPrice: units.finalPrice,
        })

      const updated = updatedRows[0]
      if (!updated) {
        return buildFailure("UPDATE_FAILED", "Property could not be updated.")
      }

      await tx.insert(auditLogs).values({
        actorUserId,
        actorRoleId: authContext.roleId,
        actionType: "PROPERTY_UPDATED",
        entityType: "PROPERTY",
        entityId: updated.id,
        beforeJson: {
          projectId: current.projectId,
          unitNo: current.unitNo,
          bookingStatusId: current.bookingStatusId,
          lotTypeId: current.lotTypeId,
          basePrice: current.basePrice,
          finalPrice: current.finalPrice,
        },
        afterJson: {
          projectId: updated.projectId,
          unitNo: updated.unitNo,
          bookingStatusId: updated.bookingStatusId,
          lotTypeId: updated.lotTypeId,
          basePrice: updated.basePrice,
          finalPrice: updated.finalPrice,
        },
        changeSummary: `Property ${updated.unitNo} updated.`,
        sourceApp: "ADMIN_PORTAL",
        metadata: {
          eventType: "PROPERTY_UPDATED",
          actorUserId,
          propertyId: updated.id,
          reasonNote,
        },
      })

      return {
        ok: true,
        propertyId: updated.id,
      }
    })
  } catch {
    return buildFailure("UPDATE_FAILED", "Property could not be updated.")
  }
}

export async function archiveAdminProperty(
  input: ArchiveAdminPropertyInput,
): Promise<AdminPropertyMutationResult> {
  const authContext = await requireRole(["ADMIN", "SUPER_ADMIN"], {
    nextPath: ROUTES.admin.properties,
  })

  const actorUserId = resolveActorUserId(authContext.user)
  if (!actorUserId) {
    return buildFailure("UNAUTHENTICATED", "Authentication is required.")
  }

  if (!db) {
    return buildFailure("FORBIDDEN", "Property service is unavailable.")
  }

  const propertyId = normalizeRequiredId(input.propertyId)
  if (!propertyId) {
    return buildFailure("VALIDATION_FAILED", "Property id is required.", {
      propertyId: "Property id is required.",
    })
  }

  const reasonNote = normalizeOptionalText(input.reasonNote, 500)

  const currentRows = await db
    .select({
      id: units.id,
      unitNo: units.unitNo,
      deletedAt: units.deletedAt,
    })
    .from(units)
    .where(eq(units.id, propertyId))
    .limit(1)

  const current = currentRows[0]
  if (!current || current.deletedAt) {
    return buildFailure("PROPERTY_NOT_FOUND", "Property was not found.")
  }

  try {
    return await db.transaction(async (tx) => {
      const now = new Date()

      const archivedRows = await tx
        .update(units)
        .set({
          deletedAt: now,
        })
        .where(eq(units.id, propertyId))
        .returning({
          id: units.id,
          unitNo: units.unitNo,
        })

      const archived = archivedRows[0]
      if (!archived) {
        return buildFailure("ARCHIVE_FAILED", "Property could not be archived.")
      }

      await tx.insert(auditLogs).values({
        actorUserId,
        actorRoleId: authContext.roleId,
        actionType: "PROPERTY_ARCHIVED",
        entityType: "PROPERTY",
        entityId: archived.id,
        beforeJson: {
          deletedAt: null,
        },
        afterJson: {
          deletedAt: now.toISOString(),
        },
        changeSummary: `Property ${archived.unitNo} archived.`,
        sourceApp: "ADMIN_PORTAL",
        metadata: {
          eventType: "PROPERTY_ARCHIVED",
          actorUserId,
          propertyId: archived.id,
          reasonNote,
        },
      })

      return {
        ok: true,
        propertyId: archived.id,
      }
    })
  } catch {
    return buildFailure("ARCHIVE_FAILED", "Property could not be archived.")
  }
}
