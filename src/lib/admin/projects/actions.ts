import "server-only"

import { and, asc, desc, eq, ilike, isNull, ne, or, sql, type SQL } from "drizzle-orm"

import { ROUTES } from "@/config/routes"
import { db } from "@/db"
import { developers, projectMedia, projects } from "@/db/schema/catalog"
import { files } from "@/db/schema/files"
import { areas, regions } from "@/db/schema/geo"
import {
  mediaTypes,
  projectStatuses,
  propertyCategories,
  propertyTypes,
  tenureTypes,
  titleTypes,
} from "@/db/schema/lookups"
import {
  type ProjectFieldErrors,
  type ProjectMutationInput,
  validateProjectMutationInput,
} from "@/lib/admin/projects/validation"
import {
  buildSafeProjectAuditSnapshot,
  writeProjectMediaAudit,
  writeProjectAudit,
} from "@/lib/admin/projects/audit"
import { requireRole } from "@/lib/auth/guards"

export type AdminProjectListItem = {
  id: string
  name: string
  displayName: string | null
  slug: string
  developerName: string | null
  regionName: string | null
  areaName: string | null
  projectStatusName: string | null
  propertyCategoryName: string | null
  propertyTypeName: string | null
  tenureTypeName: string | null
  titleTypeName: string | null
  isPublished: boolean
  totalUnits: number
  launchYear: number | null
  createdAt: string
  updatedAt: string
}

export type ProjectLookupOption = {
  id: string
  code: string
  name: string
}

export type PublishedFilter = "ALL" | "PUBLISHED" | "UNPUBLISHED"

export type ListAdminProjectsParams = {
  search?: string
  status?: string
  published?: PublishedFilter | string
  category?: string
  page?: number
  pageSize?: number
}

export type ListAdminProjectsResult = {
  projects: AdminProjectListItem[]
  search: string
  status: string | "ALL"
  published: PublishedFilter
  category: string | "ALL"
  page: number
  pageSize: number
  total: number
  statusOptions: ProjectLookupOption[]
  categoryOptions: ProjectLookupOption[]
}

export type AdminProjectFormOption = {
  id: string
  code: string | null
  name: string
}

export type AdminProjectPropertyTypeOption = AdminProjectFormOption & {
  categoryId: string | null
}

export type AdminProjectAreaOption = AdminProjectFormOption & {
  regionId: string
}

export type AdminProjectFormOptions = {
  developers: AdminProjectFormOption[]
  projectStatuses: AdminProjectFormOption[]
  propertyCategories: AdminProjectFormOption[]
  propertyTypes: AdminProjectPropertyTypeOption[]
  tenureTypes: AdminProjectFormOption[]
  titleTypes: AdminProjectFormOption[]
  mediaTypes: AdminProjectFormOption[]
  regions: AdminProjectFormOption[]
  areas: AdminProjectAreaOption[]
  featuredFiles: AdminProjectFormOption[]
}

export type AdminProjectEditable = {
  id: string
  name: string
  slug: string
  displayName: string | null
  legalName: string | null
  description: string | null
  developerId: string
  propertyCategoryId: string | null
  propertyTypeId: string | null
  projectStatusId: string | null
  tenureTypeId: string
  titleTypeId: string | null
  regionId: string | null
  areaId: string | null
  address: string | null
  latitude: string | null
  longitude: string | null
  landAreaAcres: string | null
  totalUnits: number
  launchYear: number | null
  isPublished: boolean
  featuredFileId: string | null
  createdAt: string
  updatedAt: string
}

export type AdminProjectMutationFailureCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "VALIDATION_FAILED"
  | "PROJECT_NOT_FOUND"
  | "SLUG_ALREADY_EXISTS"
  | "LOOKUP_NOT_FOUND"
  | "CREATE_FAILED"
  | "UPDATE_FAILED"

export type AdminProjectMutationSuccess = {
  ok: true
  projectId: string
  slug: string
}

export type AdminProjectMutationFailure = {
  ok: false
  code: AdminProjectMutationFailureCode
  message: string
  fieldErrors?: ProjectFieldErrors
}

export type AdminProjectMutationResult =
  | AdminProjectMutationSuccess
  | AdminProjectMutationFailure

export type AdminProjectMediaListItem = {
  id: string
  projectId: string
  fileId: string
  mediaTypeId: string | null
  mediaTypeCode: string | null
  mediaTypeName: string | null
  caption: string | null
  sortOrder: number
  fileKey: string | null
  fileUrl: string | null
  fileMimeType: string | null
  fileScanStatus: string | null
  fileVisibilityScope: string | null
  fileDeletedAt: string | null
  createdAt: string
  updatedAt: string
}

export type ListAdminProjectMediaResult =
  | {
      ok: true
      items: AdminProjectMediaListItem[]
    }
  | {
      ok: false
      code: "VALIDATION_FAILED" | "PROJECT_NOT_FOUND"
      message: string
      fieldErrors?: ProjectFieldErrors
    }

export type AttachAdminProjectMediaInput = {
  projectId: unknown
  fileId: unknown
  mediaTypeId?: unknown
  caption?: unknown
  sortOrder?: unknown
}

export type RemoveAdminProjectMediaInput = {
  projectId: unknown
  projectMediaId: unknown
}

export type AdminProjectMediaMutationFailureCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "VALIDATION_FAILED"
  | "PROJECT_NOT_FOUND"
  | "FILE_NOT_FOUND"
  | "MEDIA_TYPE_NOT_FOUND"
  | "PROJECT_MEDIA_NOT_FOUND"
  | "PROJECT_MEDIA_ALREADY_LINKED"
  | "ATTACH_FAILED"
  | "REMOVE_FAILED"

export type AdminProjectMediaMutationSuccess = {
  ok: true
  projectId: string
  projectMediaId: string
}

export type AdminProjectMediaMutationFailure = {
  ok: false
  code: AdminProjectMediaMutationFailureCode
  message: string
  fieldErrors?: ProjectFieldErrors
}

export type AdminProjectMediaMutationResult =
  | AdminProjectMediaMutationSuccess
  | AdminProjectMediaMutationFailure

export type GetAdminProjectByIdResult =
  | {
      ok: true
      project: AdminProjectEditable
    }
  | {
      ok: false
      code: "VALIDATION_FAILED" | "PROJECT_NOT_FOUND"
      message: string
      fieldErrors?: ProjectFieldErrors
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

function normalizePublishedFilter(value?: string): PublishedFilter {
  if (!value) {
    return "ALL"
  }

  const normalized = value.trim().toUpperCase()
  switch (normalized) {
    case "PUBLISHED":
    case "UNPUBLISHED":
      return normalized
    default:
      return "ALL"
  }
}

function buildFailure(
  code: AdminProjectMutationFailureCode,
  message: string,
  fieldErrors?: ProjectFieldErrors,
): AdminProjectMutationFailure {
  return {
    ok: false,
    code,
    message,
    fieldErrors,
  }
}

function buildProjectMediaFailure(
  code: AdminProjectMediaMutationFailureCode,
  message: string,
  fieldErrors?: ProjectFieldErrors,
): AdminProjectMediaMutationFailure {
  return {
    ok: false,
    code,
    message,
    fieldErrors,
  }
}

function normalizeProjectId(value: unknown): string | null {
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

function normalizeOptionalInteger(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value) || !Number.isInteger(value)) {
      return undefined
    }

    return value
  }

  if (typeof value !== "string") {
    return undefined
  }

  const normalized = value.trim()
  if (!normalized) {
    return undefined
  }

  if (!/^-?\d+$/.test(normalized)) {
    return undefined
  }

  const parsed = Number.parseInt(normalized, 10)
  return Number.isFinite(parsed) ? parsed : undefined
}

function resolveActorUserId(value: unknown): string | null {
  if (!value || typeof value !== "object") {
    return null
  }

  const candidate = (value as { id?: unknown }).id
  return typeof candidate === "string" && candidate ? candidate : null
}

class AuditWriteFailedError extends Error {
  constructor() {
    super("AUDIT_WRITE_FAILED")
    this.name = "AuditWriteFailedError"
  }
}

type SelectClient = {
  select: NonNullable<typeof db>["select"]
}

async function slugExists(client: SelectClient, slug: string, excludeProjectId?: string): Promise<boolean> {
  if (!client) {
    return false
  }

  const whereExpression = excludeProjectId
    ? and(eq(projects.slug, slug), ne(projects.id, excludeProjectId))
    : eq(projects.slug, slug)

  const rows = await client
    .select({
      id: projects.id,
    })
    .from(projects)
    .where(whereExpression)
    .limit(1)

  return rows.length > 0
}

async function lookupExists(
  client: SelectClient,
  table:
    | typeof developers
    | typeof projectStatuses
    | typeof propertyCategories
    | typeof propertyTypes
    | typeof tenureTypes
    | typeof titleTypes
    | typeof regions
    | typeof areas
    | typeof files,
  id: string,
): Promise<boolean> {
  if (!client) {
    return false
  }

  const rows = await client
    .select({
      id: table.id,
    })
    .from(table)
    .where(eq(table.id, id))
    .limit(1)

  return rows.length > 0
}

type ActiveProjectSnapshot = {
  id: string
  name: string
  slug: string
  isPublished: boolean
}

async function getActiveProjectSnapshot(
  client: SelectClient,
  projectId: string,
): Promise<ActiveProjectSnapshot | null> {
  const rows = await client
    .select({
      id: projects.id,
      name: projects.name,
      slug: projects.slug,
      isPublished: projects.isPublished,
    })
    .from(projects)
    .where(and(eq(projects.id, projectId), isNull(projects.deletedAt)))
    .limit(1)

  return rows[0] ?? null
}

type ActiveFileRecord = {
  id: string
  key: string
  mimeType: string | null
  scanStatus: string
  visibilityScope: string
}

async function getActiveFileRecord(client: SelectClient, fileId: string): Promise<ActiveFileRecord | null> {
  const rows = await client
    .select({
      id: files.id,
      key: files.key,
      mimeType: files.mimeType,
      scanStatus: files.scanStatus,
      visibilityScope: files.visibilityScope,
    })
    .from(files)
    .where(and(eq(files.id, fileId), isNull(files.deletedAt)))
    .limit(1)

  return rows[0] ?? null
}

type ActiveMediaTypeRecord = {
  id: string
  code: string
  name: string
}

async function getActiveMediaTypeRecord(
  client: SelectClient,
  mediaTypeId: string,
): Promise<ActiveMediaTypeRecord | null> {
  const rows = await client
    .select({
      id: mediaTypes.id,
      code: mediaTypes.code,
      name: mediaTypes.name,
    })
    .from(mediaTypes)
    .where(
      and(
        eq(mediaTypes.id, mediaTypeId),
        isNull(mediaTypes.deletedAt),
        eq(mediaTypes.isActive, true),
      ),
    )
    .limit(1)

  return rows[0] ?? null
}

function toEditableProjectInput(project: AdminProjectEditable, input: ProjectMutationInput): ProjectMutationInput {
  return {
    projectId: project.id,
    name: input.name ?? project.name,
    slug: input.slug ?? project.slug,
    displayName: input.displayName ?? project.displayName,
    legalName: input.legalName ?? project.legalName,
    description: input.description ?? project.description,
    developerId: input.developerId ?? project.developerId,
    propertyCategoryId: input.propertyCategoryId ?? project.propertyCategoryId,
    propertyTypeId: input.propertyTypeId ?? project.propertyTypeId,
    projectStatusId: input.projectStatusId ?? project.projectStatusId,
    tenureTypeId: input.tenureTypeId ?? project.tenureTypeId,
    titleTypeId: input.titleTypeId ?? project.titleTypeId,
    regionId: input.regionId ?? project.regionId,
    areaId: input.areaId ?? project.areaId,
    address: input.address ?? project.address,
    latitude: input.latitude ?? project.latitude,
    longitude: input.longitude ?? project.longitude,
    landAreaAcres: input.landAreaAcres ?? project.landAreaAcres,
    totalUnits: input.totalUnits ?? project.totalUnits,
    launchYear: input.launchYear ?? project.launchYear,
    isPublished: input.isPublished ?? project.isPublished,
    featuredFileId: input.featuredFileId ?? project.featuredFileId,
  }
}

export async function listAdminProjects(
  params: ListAdminProjectsParams = {},
): Promise<ListAdminProjectsResult> {
  await requireRole(["ADMIN", "SUPER_ADMIN"], {
    nextPath: ROUTES.admin.projects,
  })

  if (!db) {
    return {
      projects: [],
      search: "",
      status: "ALL",
      published: "ALL",
      category: "ALL",
      page: 1,
      pageSize: 20,
      total: 0,
      statusOptions: [],
      categoryOptions: [],
    }
  }

  const search = typeof params.search === "string" ? params.search.trim() : ""
  const status = normalizeTextFilter(params.status)
  const category = normalizeTextFilter(params.category)
  const published = normalizePublishedFilter(params.published)
  const page = normalizePositiveInt(params.page, 1, 500)
  const pageSize = normalizePositiveInt(params.pageSize, 20, 100)

  const whereClauses: SQL<unknown>[] = []

  if (search) {
    const searchPattern = `%${search}%`
    whereClauses.push(
      or(
        ilike(projects.name, searchPattern),
        ilike(projects.displayName, searchPattern),
        ilike(projects.slug, searchPattern),
        ilike(developers.name, searchPattern),
        ilike(regions.name, searchPattern),
        ilike(areas.name, searchPattern),
      )!,
    )
  }

  if (status !== "ALL") {
    whereClauses.push(eq(projects.projectStatusId, status))
  }

  if (category !== "ALL") {
    whereClauses.push(eq(projects.propertyCategoryId, category))
  }

  if (published === "PUBLISHED") {
    whereClauses.push(eq(projects.isPublished, true))
  }

  if (published === "UNPUBLISHED") {
    whereClauses.push(eq(projects.isPublished, false))
  }

  const whereExpression =
    whereClauses.length === 0
      ? undefined
      : whereClauses.length === 1
        ? whereClauses[0]
        : and(...whereClauses)

  const [{ total }] = await db
    .select({
      total: sql<number>`count(*)`,
    })
    .from(projects)
    .leftJoin(developers, eq(projects.developerId, developers.id))
    .leftJoin(projectStatuses, eq(projects.projectStatusId, projectStatuses.id))
    .leftJoin(propertyCategories, eq(projects.propertyCategoryId, propertyCategories.id))
    .leftJoin(propertyTypes, eq(projects.propertyTypeId, propertyTypes.id))
    .leftJoin(tenureTypes, eq(projects.tenureTypeId, tenureTypes.id))
    .leftJoin(titleTypes, eq(projects.titleTypeId, titleTypes.id))
    .leftJoin(regions, eq(projects.regionId, regions.id))
    .leftJoin(areas, eq(projects.areaId, areas.id))
    .where(whereExpression)

  const rows = await db
    .select({
      id: projects.id,
      name: projects.name,
      displayName: projects.displayName,
      slug: projects.slug,
      developerName: developers.name,
      regionName: regions.name,
      areaName: areas.name,
      projectStatusName: projectStatuses.name,
      propertyCategoryName: propertyCategories.name,
      propertyTypeName: propertyTypes.name,
      tenureTypeName: tenureTypes.name,
      titleTypeName: titleTypes.name,
      isPublished: projects.isPublished,
      totalUnits: projects.totalUnits,
      launchYear: projects.launchYear,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
    })
    .from(projects)
    .leftJoin(developers, eq(projects.developerId, developers.id))
    .leftJoin(projectStatuses, eq(projects.projectStatusId, projectStatuses.id))
    .leftJoin(propertyCategories, eq(projects.propertyCategoryId, propertyCategories.id))
    .leftJoin(propertyTypes, eq(projects.propertyTypeId, propertyTypes.id))
    .leftJoin(tenureTypes, eq(projects.tenureTypeId, tenureTypes.id))
    .leftJoin(titleTypes, eq(projects.titleTypeId, titleTypes.id))
    .leftJoin(regions, eq(projects.regionId, regions.id))
    .leftJoin(areas, eq(projects.areaId, areas.id))
    .where(whereExpression)
    .orderBy(desc(projects.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize)

  const statusOptionsRows = await db
    .select({
      id: projectStatuses.id,
      code: projectStatuses.code,
      name: projectStatuses.name,
    })
    .from(projectStatuses)
    .orderBy(asc(projectStatuses.sortOrder), asc(projectStatuses.name))

  const categoryOptionsRows = await db
    .select({
      id: propertyCategories.id,
      code: propertyCategories.code,
      name: propertyCategories.name,
    })
    .from(propertyCategories)
    .orderBy(asc(propertyCategories.sortOrder), asc(propertyCategories.name))

  return {
    projects: rows.map((row) => ({
      id: row.id,
      name: row.name,
      displayName: row.displayName,
      slug: row.slug,
      developerName: row.developerName,
      regionName: row.regionName,
      areaName: row.areaName,
      projectStatusName: row.projectStatusName,
      propertyCategoryName: row.propertyCategoryName,
      propertyTypeName: row.propertyTypeName,
      tenureTypeName: row.tenureTypeName,
      titleTypeName: row.titleTypeName,
      isPublished: row.isPublished,
      totalUnits: row.totalUnits,
      launchYear: row.launchYear,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })),
    search,
    status,
    published,
    category,
    page,
    pageSize,
    total: Number(total ?? 0),
    statusOptions: statusOptionsRows,
    categoryOptions: categoryOptionsRows,
  }
}

export async function getAdminProjectFormOptions(): Promise<AdminProjectFormOptions> {
  await requireRole(["ADMIN", "SUPER_ADMIN"], {
    nextPath: ROUTES.admin.projects,
  })

  if (!db) {
    return {
      developers: [],
      projectStatuses: [],
      propertyCategories: [],
      propertyTypes: [],
      tenureTypes: [],
      titleTypes: [],
      mediaTypes: [],
      regions: [],
      areas: [],
      featuredFiles: [],
    }
  }

  const [
    developersRows,
    projectStatusRows,
    propertyCategoryRows,
    propertyTypeRows,
    tenureTypeRows,
    titleTypeRows,
    mediaTypeRows,
    regionRows,
    areaRows,
    featuredFileRows,
  ] = await Promise.all([
    db
      .select({
        id: developers.id,
        code: developers.slug,
        name: developers.name,
      })
      .from(developers)
      .orderBy(asc(developers.name)),
    db
      .select({
        id: projectStatuses.id,
        code: projectStatuses.code,
        name: projectStatuses.name,
      })
      .from(projectStatuses)
      .orderBy(asc(projectStatuses.sortOrder), asc(projectStatuses.name)),
    db
      .select({
        id: propertyCategories.id,
        code: propertyCategories.code,
        name: propertyCategories.name,
      })
      .from(propertyCategories)
      .orderBy(asc(propertyCategories.sortOrder), asc(propertyCategories.name)),
    db
      .select({
        id: propertyTypes.id,
        code: propertyTypes.code,
        name: propertyTypes.name,
        categoryId: propertyTypes.categoryId,
      })
      .from(propertyTypes)
      .orderBy(asc(propertyTypes.sortOrder), asc(propertyTypes.name)),
    db
      .select({
        id: tenureTypes.id,
        code: tenureTypes.code,
        name: tenureTypes.name,
      })
      .from(tenureTypes)
      .orderBy(asc(tenureTypes.sortOrder), asc(tenureTypes.name)),
    db
      .select({
        id: titleTypes.id,
        code: titleTypes.code,
        name: titleTypes.name,
      })
      .from(titleTypes)
      .orderBy(asc(titleTypes.sortOrder), asc(titleTypes.name)),
    db
      .select({
        id: mediaTypes.id,
        code: mediaTypes.code,
        name: mediaTypes.name,
      })
      .from(mediaTypes)
      .where(and(isNull(mediaTypes.deletedAt), eq(mediaTypes.isActive, true)))
      .orderBy(asc(mediaTypes.sortOrder), asc(mediaTypes.name)),
    db
      .select({
        id: regions.id,
        code: regions.slug,
        name: regions.name,
      })
      .from(regions)
      .orderBy(asc(regions.name)),
    db
      .select({
        id: areas.id,
        code: areas.slug,
        name: areas.name,
        regionId: areas.regionId,
      })
      .from(areas)
      .orderBy(asc(areas.name)),
    db
      .select({
        id: files.id,
        code: files.mimeType,
        name: files.key,
      })
      .from(files)
      .where(isNull(files.deletedAt))
      .orderBy(desc(files.createdAt))
      .limit(200),
  ])

  return {
    developers: developersRows,
    projectStatuses: projectStatusRows,
    propertyCategories: propertyCategoryRows,
    propertyTypes: propertyTypeRows,
    tenureTypes: tenureTypeRows,
    titleTypes: titleTypeRows,
    mediaTypes: mediaTypeRows,
    regions: regionRows,
    areas: areaRows,
    featuredFiles: featuredFileRows,
  }
}

export async function getAdminProjectById(projectId: string): Promise<GetAdminProjectByIdResult> {
  await requireRole(["ADMIN", "SUPER_ADMIN"], {
    nextPath: ROUTES.admin.projects,
  })

  const normalizedProjectId = normalizeProjectId(projectId)
  if (!normalizedProjectId) {
    return {
      ok: false,
      code: "VALIDATION_FAILED",
      message: "Project id is required.",
      fieldErrors: {
        projectId: "Project id is required.",
      },
    }
  }

  if (!db) {
    return {
      ok: false,
      code: "PROJECT_NOT_FOUND",
      message: "Project was not found.",
    }
  }

  const rows = await db
    .select({
      id: projects.id,
      name: projects.name,
      slug: projects.slug,
      displayName: projects.displayName,
      legalName: projects.legalName,
      description: projects.description,
      developerId: projects.developerId,
      propertyCategoryId: projects.propertyCategoryId,
      propertyTypeId: projects.propertyTypeId,
      projectStatusId: projects.projectStatusId,
      tenureTypeId: projects.tenureTypeId,
      titleTypeId: projects.titleTypeId,
      regionId: projects.regionId,
      areaId: projects.areaId,
      address: projects.address,
      latitude: projects.latitude,
      longitude: projects.longitude,
      landAreaAcres: projects.landAreaAcres,
      totalUnits: projects.totalUnits,
      launchYear: projects.launchYear,
      isPublished: projects.isPublished,
      featuredFileId: projects.featuredFileId,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
    })
    .from(projects)
    .where(eq(projects.id, normalizedProjectId))
    .limit(1)

  const row = rows[0]
  if (!row) {
    return {
      ok: false,
      code: "PROJECT_NOT_FOUND",
      message: "Project was not found.",
    }
  }

  return {
    ok: true,
    project: {
      id: row.id,
      name: row.name,
      slug: row.slug,
      displayName: row.displayName,
      legalName: row.legalName,
      description: row.description,
      developerId: row.developerId,
      propertyCategoryId: row.propertyCategoryId,
      propertyTypeId: row.propertyTypeId,
      projectStatusId: row.projectStatusId,
      tenureTypeId: row.tenureTypeId,
      titleTypeId: row.titleTypeId,
      regionId: row.regionId,
      areaId: row.areaId,
      address: row.address,
      latitude: row.latitude,
      longitude: row.longitude,
      landAreaAcres: row.landAreaAcres,
      totalUnits: row.totalUnits,
      launchYear: row.launchYear,
      isPublished: row.isPublished,
      featuredFileId: row.featuredFileId,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    },
  }
}

export async function createAdminProject(input: ProjectMutationInput): Promise<AdminProjectMutationResult> {
  const authContext = await requireRole(["ADMIN", "SUPER_ADMIN"], {
    nextPath: ROUTES.admin.projects,
  })

  const actorUserId = resolveActorUserId(authContext.user)
  if (!actorUserId) {
    return buildFailure("UNAUTHENTICATED", "Authentication is required.")
  }

  if (!db) {
    return buildFailure("CREATE_FAILED", "Project create service is unavailable.")
  }

  const validation = validateProjectMutationInput(input, "create")
  if (!validation.ok) {
    return buildFailure(
      "VALIDATION_FAILED",
      "Project input is invalid.",
      validation.fieldErrors,
    )
  }

  const payload = validation.payload

  try {
    return await db.transaction(async (tx) => {
      if (await slugExists(tx, payload.slug!)) {
        return buildFailure("SLUG_ALREADY_EXISTS", "Slug is already in use.", {
          slug: "Slug is already in use.",
        })
      }

      if (!(await lookupExists(tx, developers, payload.developerId!))) {
        return buildFailure("LOOKUP_NOT_FOUND", "Developer was not found.", {
          developerId: "Developer was not found.",
        })
      }

      if (!(await lookupExists(tx, tenureTypes, payload.tenureTypeId!))) {
        return buildFailure("LOOKUP_NOT_FOUND", "Tenure type was not found.", {
          tenureTypeId: "Tenure type was not found.",
        })
      }

      if (!(await lookupExists(tx, projectStatuses, payload.projectStatusId!))) {
        return buildFailure("LOOKUP_NOT_FOUND", "Project status was not found.", {
          projectStatusId: "Project status was not found.",
        })
      }

      if (payload.propertyCategoryId && !(await lookupExists(tx, propertyCategories, payload.propertyCategoryId))) {
        return buildFailure("LOOKUP_NOT_FOUND", "Property category was not found.", {
          propertyCategoryId: "Property category was not found.",
        })
      }

      if (payload.propertyTypeId && !(await lookupExists(tx, propertyTypes, payload.propertyTypeId))) {
        return buildFailure("LOOKUP_NOT_FOUND", "Property type was not found.", {
          propertyTypeId: "Property type was not found.",
        })
      }

      if (payload.titleTypeId && !(await lookupExists(tx, titleTypes, payload.titleTypeId))) {
        return buildFailure("LOOKUP_NOT_FOUND", "Title type was not found.", {
          titleTypeId: "Title type was not found.",
        })
      }

      if (payload.regionId && !(await lookupExists(tx, regions, payload.regionId))) {
        return buildFailure("LOOKUP_NOT_FOUND", "Region was not found.", {
          regionId: "Region was not found.",
        })
      }

      if (payload.areaId && !(await lookupExists(tx, areas, payload.areaId))) {
        return buildFailure("LOOKUP_NOT_FOUND", "Area was not found.", {
          areaId: "Area was not found.",
        })
      }

      if (payload.featuredFileId && !(await lookupExists(tx, files, payload.featuredFileId))) {
        return buildFailure("LOOKUP_NOT_FOUND", "Featured file was not found.", {
          featuredFileId: "Featured file was not found.",
        })
      }

      const rows = await tx
        .insert(projects)
        .values({
          name: payload.name!,
          slug: payload.slug!,
          displayName: payload.displayName ?? null,
          legalName: payload.legalName ?? null,
          description: payload.description ?? null,
          developerId: payload.developerId!,
          propertyCategoryId: payload.propertyCategoryId ?? null,
          propertyTypeId: payload.propertyTypeId ?? null,
          projectStatusId: payload.projectStatusId!,
          tenureTypeId: payload.tenureTypeId!,
          titleTypeId: payload.titleTypeId ?? null,
          regionId: payload.regionId ?? null,
          areaId: payload.areaId ?? null,
          address: payload.address ?? null,
          latitude: payload.latitude ?? null,
          longitude: payload.longitude ?? null,
          landAreaAcres: payload.landAreaAcres ?? null,
          totalUnits: payload.totalUnits ?? 0,
          launchYear: payload.launchYear ?? null,
          isPublished: payload.isPublished ?? false,
          featuredFileId: payload.featuredFileId ?? null,
        })
        .returning({
          id: projects.id,
          slug: projects.slug,
          name: projects.name,
          isPublished: projects.isPublished,
        })

      const created = rows[0]
      if (!created) {
        return buildFailure("CREATE_FAILED", "Project could not be created.")
      }

      try {
        await writeProjectAudit(tx, {
          mode: "create",
          actorUserId,
          actorRoleId: authContext.roleId,
          next: buildSafeProjectAuditSnapshot({
            projectId: created.id,
            name: created.name,
            slug: created.slug,
            isPublished: created.isPublished,
          }),
        })
      } catch {
        throw new AuditWriteFailedError()
      }

      return {
        ok: true,
        projectId: created.id,
        slug: created.slug,
      }
    })
  } catch {
    return buildFailure("CREATE_FAILED", "Project could not be created.")
  }
}

export async function updateAdminProject(input: ProjectMutationInput): Promise<AdminProjectMutationResult> {
  const authContext = await requireRole(["ADMIN", "SUPER_ADMIN"], {
    nextPath: ROUTES.admin.projects,
  })

  const actorUserId = resolveActorUserId(authContext.user)
  if (!actorUserId) {
    return buildFailure("UNAUTHENTICATED", "Authentication is required.")
  }

  if (!db) {
    return buildFailure("UPDATE_FAILED", "Project update service is unavailable.")
  }

  const projectId = normalizeProjectId(input.projectId)
  if (!projectId) {
    return buildFailure("VALIDATION_FAILED", "Project id is required.", {
      projectId: "Project id is required.",
    })
  }

  try {
    return await db.transaction(async (tx) => {
      const existingRows = await tx
        .select({
          id: projects.id,
          name: projects.name,
          slug: projects.slug,
          displayName: projects.displayName,
          legalName: projects.legalName,
          description: projects.description,
          developerId: projects.developerId,
          propertyCategoryId: projects.propertyCategoryId,
          propertyTypeId: projects.propertyTypeId,
          projectStatusId: projects.projectStatusId,
          tenureTypeId: projects.tenureTypeId,
          titleTypeId: projects.titleTypeId,
          regionId: projects.regionId,
          areaId: projects.areaId,
          address: projects.address,
          latitude: projects.latitude,
          longitude: projects.longitude,
          landAreaAcres: projects.landAreaAcres,
          totalUnits: projects.totalUnits,
          launchYear: projects.launchYear,
          isPublished: projects.isPublished,
          featuredFileId: projects.featuredFileId,
          createdAt: projects.createdAt,
          updatedAt: projects.updatedAt,
        })
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1)

      const existing = existingRows[0]
      if (!existing) {
        return buildFailure("PROJECT_NOT_FOUND", "Project was not found.")
      }

      const existingProject: AdminProjectEditable = {
        id: existing.id,
        name: existing.name,
        slug: existing.slug,
        displayName: existing.displayName,
        legalName: existing.legalName,
        description: existing.description,
        developerId: existing.developerId,
        propertyCategoryId: existing.propertyCategoryId,
        propertyTypeId: existing.propertyTypeId,
        projectStatusId: existing.projectStatusId,
        tenureTypeId: existing.tenureTypeId,
        titleTypeId: existing.titleTypeId,
        regionId: existing.regionId,
        areaId: existing.areaId,
        address: existing.address,
        latitude: existing.latitude,
        longitude: existing.longitude,
        landAreaAcres: existing.landAreaAcres,
        totalUnits: existing.totalUnits,
        launchYear: existing.launchYear,
        isPublished: existing.isPublished,
        featuredFileId: existing.featuredFileId,
        createdAt: existing.createdAt.toISOString(),
        updatedAt: existing.updatedAt.toISOString(),
      }

      const completeInput = toEditableProjectInput(existingProject, input)
      const validation = validateProjectMutationInput(completeInput, "update")
      if (!validation.ok) {
        return buildFailure(
          "VALIDATION_FAILED",
          "Project input is invalid.",
          validation.fieldErrors,
        )
      }

      const payload = validation.payload

      if (!payload.slug) {
        return buildFailure("VALIDATION_FAILED", "Slug is required.", {
          slug: "Slug is required.",
        })
      }

      if (await slugExists(tx, payload.slug, projectId)) {
        return buildFailure("SLUG_ALREADY_EXISTS", "Slug is already in use.", {
          slug: "Slug is already in use.",
        })
      }

      if (payload.developerId && !(await lookupExists(tx, developers, payload.developerId))) {
        return buildFailure("LOOKUP_NOT_FOUND", "Developer was not found.", {
          developerId: "Developer was not found.",
        })
      }

      if (payload.tenureTypeId && !(await lookupExists(tx, tenureTypes, payload.tenureTypeId))) {
        return buildFailure("LOOKUP_NOT_FOUND", "Tenure type was not found.", {
          tenureTypeId: "Tenure type was not found.",
        })
      }

      if (payload.projectStatusId && !(await lookupExists(tx, projectStatuses, payload.projectStatusId))) {
        return buildFailure("LOOKUP_NOT_FOUND", "Project status was not found.", {
          projectStatusId: "Project status was not found.",
        })
      }

      if (payload.propertyCategoryId && !(await lookupExists(tx, propertyCategories, payload.propertyCategoryId))) {
        return buildFailure("LOOKUP_NOT_FOUND", "Property category was not found.", {
          propertyCategoryId: "Property category was not found.",
        })
      }

      if (payload.propertyTypeId && !(await lookupExists(tx, propertyTypes, payload.propertyTypeId))) {
        return buildFailure("LOOKUP_NOT_FOUND", "Property type was not found.", {
          propertyTypeId: "Property type was not found.",
        })
      }

      if (payload.titleTypeId && !(await lookupExists(tx, titleTypes, payload.titleTypeId))) {
        return buildFailure("LOOKUP_NOT_FOUND", "Title type was not found.", {
          titleTypeId: "Title type was not found.",
        })
      }

      if (payload.regionId && !(await lookupExists(tx, regions, payload.regionId))) {
        return buildFailure("LOOKUP_NOT_FOUND", "Region was not found.", {
          regionId: "Region was not found.",
        })
      }

      if (payload.areaId && !(await lookupExists(tx, areas, payload.areaId))) {
        return buildFailure("LOOKUP_NOT_FOUND", "Area was not found.", {
          areaId: "Area was not found.",
        })
      }

      if (payload.featuredFileId && !(await lookupExists(tx, files, payload.featuredFileId))) {
        return buildFailure("LOOKUP_NOT_FOUND", "Featured file was not found.", {
          featuredFileId: "Featured file was not found.",
        })
      }

      const rows = await tx
        .update(projects)
        .set({
          name: payload.name,
          slug: payload.slug,
          displayName: payload.displayName,
          legalName: payload.legalName,
          description: payload.description,
          developerId: payload.developerId,
          propertyCategoryId: payload.propertyCategoryId,
          propertyTypeId: payload.propertyTypeId,
          projectStatusId: payload.projectStatusId,
          tenureTypeId: payload.tenureTypeId,
          titleTypeId: payload.titleTypeId,
          regionId: payload.regionId,
          areaId: payload.areaId,
          address: payload.address,
          latitude: payload.latitude,
          longitude: payload.longitude,
          landAreaAcres: payload.landAreaAcres,
          totalUnits: payload.totalUnits,
          launchYear: payload.launchYear,
          isPublished: payload.isPublished,
          featuredFileId: payload.featuredFileId,
          updatedAt: new Date(),
        })
        .where(eq(projects.id, projectId))
        .returning({
          id: projects.id,
          slug: projects.slug,
          name: projects.name,
          isPublished: projects.isPublished,
        })

      const updated = rows[0]
      if (!updated) {
        return buildFailure("UPDATE_FAILED", "Project could not be updated.")
      }

      try {
        await writeProjectAudit(tx, {
          mode: "update",
          actorUserId,
          actorRoleId: authContext.roleId,
          previous: buildSafeProjectAuditSnapshot({
            projectId: existingProject.id,
            name: existingProject.name,
            slug: existingProject.slug,
            isPublished: existingProject.isPublished,
          }),
          next: buildSafeProjectAuditSnapshot({
            projectId: updated.id,
            name: updated.name,
            slug: updated.slug,
            isPublished: updated.isPublished,
          }),
        })
      } catch {
        throw new AuditWriteFailedError()
      }

      return {
        ok: true,
        projectId: updated.id,
        slug: updated.slug,
      }
    })
  } catch {
    return buildFailure("UPDATE_FAILED", "Project could not be updated.")
  }
}

export async function listAdminProjectMedia(projectId: string): Promise<ListAdminProjectMediaResult> {
  await requireRole(["ADMIN", "SUPER_ADMIN"], {
    nextPath: ROUTES.admin.projects,
  })

  const normalizedProjectId = normalizeProjectId(projectId)
  if (!normalizedProjectId) {
    return {
      ok: false,
      code: "VALIDATION_FAILED",
      message: "Project id is required.",
      fieldErrors: {
        projectId: "Project id is required.",
      },
    }
  }

  if (!db) {
    return {
      ok: true,
      items: [],
    }
  }

  const project = await getActiveProjectSnapshot(db, normalizedProjectId)
  if (!project) {
    return {
      ok: false,
      code: "PROJECT_NOT_FOUND",
      message: "Project was not found.",
    }
  }

  const rows = await db
    .select({
      id: projectMedia.id,
      projectId: projectMedia.projectId,
      fileId: projectMedia.fileId,
      mediaTypeId: projectMedia.mediaTypeId,
      caption: projectMedia.caption,
      sortOrder: projectMedia.sortOrder,
      createdAt: projectMedia.createdAt,
      updatedAt: projectMedia.updatedAt,
      mediaTypeCode: mediaTypes.code,
      mediaTypeName: mediaTypes.name,
      fileKey: files.key,
      fileUrl: files.url,
      fileMimeType: files.mimeType,
      fileScanStatus: files.scanStatus,
      fileVisibilityScope: files.visibilityScope,
      fileDeletedAt: files.deletedAt,
    })
    .from(projectMedia)
    .leftJoin(files, eq(projectMedia.fileId, files.id))
    .leftJoin(mediaTypes, eq(projectMedia.mediaTypeId, mediaTypes.id))
    .where(and(eq(projectMedia.projectId, normalizedProjectId), isNull(projectMedia.deletedAt)))
    .orderBy(asc(projectMedia.sortOrder), desc(projectMedia.createdAt))

  return {
    ok: true,
    items: rows.map((row) => ({
      id: row.id,
      projectId: row.projectId,
      fileId: row.fileId,
      mediaTypeId: row.mediaTypeId,
      mediaTypeCode: row.mediaTypeCode,
      mediaTypeName: row.mediaTypeName,
      caption: row.caption,
      sortOrder: row.sortOrder,
      fileKey: row.fileKey,
      fileUrl: row.fileUrl,
      fileMimeType: row.fileMimeType,
      fileScanStatus: row.fileScanStatus,
      fileVisibilityScope: row.fileVisibilityScope,
      fileDeletedAt: row.fileDeletedAt ? row.fileDeletedAt.toISOString() : null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })),
  }
}

export async function attachAdminProjectMedia(
  input: AttachAdminProjectMediaInput,
): Promise<AdminProjectMediaMutationResult> {
  const authContext = await requireRole(["ADMIN", "SUPER_ADMIN"], {
    nextPath: ROUTES.admin.projects,
  })

  const actorUserId = resolveActorUserId(authContext.user)
  if (!actorUserId) {
    return buildProjectMediaFailure("UNAUTHENTICATED", "Authentication is required.")
  }

  if (!db) {
    return buildProjectMediaFailure("ATTACH_FAILED", "Project media attach service is unavailable.")
  }

  const projectId = normalizeProjectId(input.projectId)
  const fileId = normalizeProjectId(input.fileId)
  const rawMediaTypeId = normalizeOptionalText(input.mediaTypeId, 200)
  const mediaTypeId = rawMediaTypeId ? normalizeProjectId(rawMediaTypeId) : null
  const caption = normalizeOptionalText(input.caption, 300)
  const rawSortOrder = input.sortOrder
  const sortOrder = normalizeOptionalInteger(rawSortOrder)
  const hasSortOrderInput =
    rawSortOrder !== undefined
    && rawSortOrder !== null
    && !(typeof rawSortOrder === "string" && rawSortOrder.trim() === "")

  const fieldErrors: ProjectFieldErrors = {}

  if (!projectId) {
    fieldErrors.projectId = "Project id is required."
  }

  if (!fileId) {
    fieldErrors.fileId = "File id is required."
  }

  if (input.mediaTypeId !== undefined && rawMediaTypeId === undefined) {
    fieldErrors.mediaTypeId = "Media type id is invalid."
  } else if (rawMediaTypeId && !mediaTypeId) {
    fieldErrors.mediaTypeId = "Media type id is invalid."
  }

  if (input.caption !== undefined && caption === undefined) {
    fieldErrors.caption = "Caption is invalid."
  }

  if (hasSortOrderInput && sortOrder === undefined) {
    fieldErrors.sortOrder = "Sort order must be an integer."
  } else if (sortOrder !== undefined && sortOrder < 0) {
    fieldErrors.sortOrder = "Sort order must be 0 or greater."
  }

  if (Object.keys(fieldErrors).length > 0) {
    return buildProjectMediaFailure("VALIDATION_FAILED", "Project media input is invalid.", fieldErrors)
  }

  try {
    return await db.transaction(async (tx) => {
      const project = await getActiveProjectSnapshot(tx, projectId!)
      if (!project) {
        return buildProjectMediaFailure("PROJECT_NOT_FOUND", "Project was not found.", {
          projectId: "Project was not found.",
        })
      }

      const fileRecord = await getActiveFileRecord(tx, fileId!)
      if (!fileRecord) {
        return buildProjectMediaFailure("FILE_NOT_FOUND", "File was not found.", {
          fileId: "File was not found.",
        })
      }

      if (mediaTypeId) {
        const mediaTypeRecord = await getActiveMediaTypeRecord(tx, mediaTypeId)
        if (!mediaTypeRecord) {
          return buildProjectMediaFailure("MEDIA_TYPE_NOT_FOUND", "Media type was not found.", {
            mediaTypeId: "Media type was not found.",
          })
        }
      }

      const duplicateRows = await tx
        .select({
          id: projectMedia.id,
        })
        .from(projectMedia)
        .where(
          and(
            eq(projectMedia.projectId, projectId!),
            eq(projectMedia.fileId, fileId!),
            isNull(projectMedia.deletedAt),
          ),
        )
        .limit(1)

      if (duplicateRows.length > 0) {
        return buildProjectMediaFailure("PROJECT_MEDIA_ALREADY_LINKED", "File is already linked to this project.", {
          fileId: "File is already linked to this project.",
        })
      }

      let resolvedSortOrder = sortOrder
      if (resolvedSortOrder === undefined) {
        const maxRows = await tx
          .select({
            maxSortOrder: sql<number | null>`max(${projectMedia.sortOrder})`,
          })
          .from(projectMedia)
          .where(and(eq(projectMedia.projectId, projectId!), isNull(projectMedia.deletedAt)))

        const maxSortOrder = maxRows[0]?.maxSortOrder
        resolvedSortOrder =
          typeof maxSortOrder === "number" && Number.isFinite(maxSortOrder)
            ? maxSortOrder + 1
            : 0
      }

      const insertRows = await tx
        .insert(projectMedia)
        .values({
          projectId: projectId!,
          fileId: fileId!,
          mediaTypeId: mediaTypeId ?? null,
          caption: caption ?? null,
          sortOrder: resolvedSortOrder,
        })
        .returning({
          id: projectMedia.id,
          projectId: projectMedia.projectId,
          fileId: projectMedia.fileId,
          mediaTypeId: projectMedia.mediaTypeId,
          caption: projectMedia.caption,
          sortOrder: projectMedia.sortOrder,
        })

      const attached = insertRows[0]
      if (!attached) {
        return buildProjectMediaFailure("ATTACH_FAILED", "Project media could not be attached.")
      }

      try {
        await writeProjectMediaAudit(tx, {
          mode: "attach",
          actorUserId,
          actorRoleId: authContext.roleId,
          project: buildSafeProjectAuditSnapshot({
            projectId: project.id,
            name: project.name,
            slug: project.slug,
            isPublished: project.isPublished,
          }),
          media: {
            projectMediaId: attached.id,
            projectId: attached.projectId,
            fileId: attached.fileId,
            mediaTypeId: attached.mediaTypeId,
            caption: attached.caption,
            sortOrder: attached.sortOrder,
          },
        })
      } catch {
        throw new AuditWriteFailedError()
      }

      return {
        ok: true,
        projectId: attached.projectId,
        projectMediaId: attached.id,
      }
    })
  } catch {
    return buildProjectMediaFailure("ATTACH_FAILED", "Project media could not be attached.")
  }
}

export async function removeAdminProjectMedia(
  input: RemoveAdminProjectMediaInput,
): Promise<AdminProjectMediaMutationResult> {
  const authContext = await requireRole(["ADMIN", "SUPER_ADMIN"], {
    nextPath: ROUTES.admin.projects,
  })

  const actorUserId = resolveActorUserId(authContext.user)
  if (!actorUserId) {
    return buildProjectMediaFailure("UNAUTHENTICATED", "Authentication is required.")
  }

  if (!db) {
    return buildProjectMediaFailure("REMOVE_FAILED", "Project media remove service is unavailable.")
  }

  const projectId = normalizeProjectId(input.projectId)
  const projectMediaId = normalizeProjectId(input.projectMediaId)

  const fieldErrors: ProjectFieldErrors = {}

  if (!projectId) {
    fieldErrors.projectId = "Project id is required."
  }

  if (!projectMediaId) {
    fieldErrors.projectMediaId = "Project media id is required."
  }

  if (Object.keys(fieldErrors).length > 0) {
    return buildProjectMediaFailure("VALIDATION_FAILED", "Project media input is invalid.", fieldErrors)
  }

  try {
    return await db.transaction(async (tx) => {
      const project = await getActiveProjectSnapshot(tx, projectId!)
      if (!project) {
        return buildProjectMediaFailure("PROJECT_NOT_FOUND", "Project was not found.", {
          projectId: "Project was not found.",
        })
      }

      const existingRows = await tx
        .select({
          id: projectMedia.id,
          projectId: projectMedia.projectId,
          fileId: projectMedia.fileId,
          mediaTypeId: projectMedia.mediaTypeId,
          caption: projectMedia.caption,
          sortOrder: projectMedia.sortOrder,
        })
        .from(projectMedia)
        .where(
          and(
            eq(projectMedia.id, projectMediaId!),
            eq(projectMedia.projectId, projectId!),
            isNull(projectMedia.deletedAt),
          ),
        )
        .limit(1)

      const existing = existingRows[0]
      if (!existing) {
        return buildProjectMediaFailure("PROJECT_MEDIA_NOT_FOUND", "Project media was not found.", {
          projectMediaId: "Project media was not found.",
        })
      }

      const now = new Date()
      const removeRows = await tx
        .update(projectMedia)
        .set({
          deletedAt: now,
          updatedAt: now,
        })
        .where(and(eq(projectMedia.id, projectMediaId!), isNull(projectMedia.deletedAt)))
        .returning({
          id: projectMedia.id,
          projectId: projectMedia.projectId,
        })

      const removed = removeRows[0]
      if (!removed) {
        return buildProjectMediaFailure("REMOVE_FAILED", "Project media could not be removed.")
      }

      try {
        await writeProjectMediaAudit(tx, {
          mode: "remove",
          actorUserId,
          actorRoleId: authContext.roleId,
          project: buildSafeProjectAuditSnapshot({
            projectId: project.id,
            name: project.name,
            slug: project.slug,
            isPublished: project.isPublished,
          }),
          media: {
            projectMediaId: existing.id,
            projectId: existing.projectId,
            fileId: existing.fileId,
            mediaTypeId: existing.mediaTypeId,
            caption: existing.caption,
            sortOrder: existing.sortOrder,
          },
        })
      } catch {
        throw new AuditWriteFailedError()
      }

      return {
        ok: true,
        projectId: removed.projectId,
        projectMediaId: removed.id,
      }
    })
  } catch {
    return buildProjectMediaFailure("REMOVE_FAILED", "Project media could not be removed.")
  }
}
