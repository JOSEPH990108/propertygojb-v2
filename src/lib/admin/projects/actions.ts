import "server-only"

import { and, asc, desc, eq, ilike, ne, or, sql, type SQL } from "drizzle-orm"

import { ROUTES } from "@/config/routes"
import { db } from "@/db"
import { developers, projects } from "@/db/schema/catalog"
import { files } from "@/db/schema/files"
import { areas, regions } from "@/db/schema/geo"
import {
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
  regions: AdminProjectFormOption[]
  areas: AdminProjectAreaOption[]
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

function normalizeProjectId(value: unknown): string | null {
  if (typeof value !== "string") {
    return null
  }

  const normalized = value.trim()
  return normalized ? normalized : null
}

async function slugExists(slug: string, excludeProjectId?: string): Promise<boolean> {
  if (!db) {
    return false
  }

  const whereExpression = excludeProjectId
    ? and(eq(projects.slug, slug), ne(projects.id, excludeProjectId))
    : eq(projects.slug, slug)

  const rows = await db
    .select({
      id: projects.id,
    })
    .from(projects)
    .where(whereExpression)
    .limit(1)

  return rows.length > 0
}

async function lookupExists(
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
  if (!db) {
    return false
  }

  const rows = await db
    .select({
      id: table.id,
    })
    .from(table)
    .where(eq(table.id, id))
    .limit(1)

  return rows.length > 0
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
      regions: [],
      areas: [],
    }
  }

  const [
    developersRows,
    projectStatusRows,
    propertyCategoryRows,
    propertyTypeRows,
    tenureTypeRows,
    titleTypeRows,
    regionRows,
    areaRows,
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
  ])

  return {
    developers: developersRows,
    projectStatuses: projectStatusRows,
    propertyCategories: propertyCategoryRows,
    propertyTypes: propertyTypeRows,
    tenureTypes: tenureTypeRows,
    titleTypes: titleTypeRows,
    regions: regionRows,
    areas: areaRows,
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
  await requireRole(["ADMIN", "SUPER_ADMIN"], {
    nextPath: ROUTES.admin.projects,
  })

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

  if (await slugExists(payload.slug!)) {
    return buildFailure("SLUG_ALREADY_EXISTS", "Slug is already in use.", {
      slug: "Slug is already in use.",
    })
  }

  if (!(await lookupExists(developers, payload.developerId!))) {
    return buildFailure("LOOKUP_NOT_FOUND", "Developer was not found.", {
      developerId: "Developer was not found.",
    })
  }

  if (!(await lookupExists(tenureTypes, payload.tenureTypeId!))) {
    return buildFailure("LOOKUP_NOT_FOUND", "Tenure type was not found.", {
      tenureTypeId: "Tenure type was not found.",
    })
  }

  if (!(await lookupExists(projectStatuses, payload.projectStatusId!))) {
    return buildFailure("LOOKUP_NOT_FOUND", "Project status was not found.", {
      projectStatusId: "Project status was not found.",
    })
  }

  if (payload.propertyCategoryId && !(await lookupExists(propertyCategories, payload.propertyCategoryId))) {
    return buildFailure("LOOKUP_NOT_FOUND", "Property category was not found.", {
      propertyCategoryId: "Property category was not found.",
    })
  }

  if (payload.propertyTypeId && !(await lookupExists(propertyTypes, payload.propertyTypeId))) {
    return buildFailure("LOOKUP_NOT_FOUND", "Property type was not found.", {
      propertyTypeId: "Property type was not found.",
    })
  }

  if (payload.titleTypeId && !(await lookupExists(titleTypes, payload.titleTypeId))) {
    return buildFailure("LOOKUP_NOT_FOUND", "Title type was not found.", {
      titleTypeId: "Title type was not found.",
    })
  }

  if (payload.regionId && !(await lookupExists(regions, payload.regionId))) {
    return buildFailure("LOOKUP_NOT_FOUND", "Region was not found.", {
      regionId: "Region was not found.",
    })
  }

  if (payload.areaId && !(await lookupExists(areas, payload.areaId))) {
    return buildFailure("LOOKUP_NOT_FOUND", "Area was not found.", {
      areaId: "Area was not found.",
    })
  }

  if (payload.featuredFileId && !(await lookupExists(files, payload.featuredFileId))) {
    return buildFailure("LOOKUP_NOT_FOUND", "Featured file was not found.", {
      featuredFileId: "Featured file was not found.",
    })
  }

  try {
    const rows = await db
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
      })

    const created = rows[0]
    if (!created) {
      return buildFailure("CREATE_FAILED", "Project could not be created.")
    }

    // Audit logging is intentionally deferred to Phase 2D.6.
    return {
      ok: true,
      projectId: created.id,
      slug: created.slug,
    }
  } catch {
    return buildFailure("CREATE_FAILED", "Project could not be created.")
  }
}

export async function updateAdminProject(input: ProjectMutationInput): Promise<AdminProjectMutationResult> {
  await requireRole(["ADMIN", "SUPER_ADMIN"], {
    nextPath: ROUTES.admin.projects,
  })

  if (!db) {
    return buildFailure("UPDATE_FAILED", "Project update service is unavailable.")
  }

  const projectId = normalizeProjectId(input.projectId)
  if (!projectId) {
    return buildFailure("VALIDATION_FAILED", "Project id is required.", {
      projectId: "Project id is required.",
    })
  }

  const existingResult = await getAdminProjectById(projectId)
  if (!existingResult.ok) {
    return buildFailure("PROJECT_NOT_FOUND", "Project was not found.")
  }

  const completeInput = toEditableProjectInput(existingResult.project, input)
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

  if (await slugExists(payload.slug, projectId)) {
    return buildFailure("SLUG_ALREADY_EXISTS", "Slug is already in use.", {
      slug: "Slug is already in use.",
    })
  }

  if (payload.developerId && !(await lookupExists(developers, payload.developerId))) {
    return buildFailure("LOOKUP_NOT_FOUND", "Developer was not found.", {
      developerId: "Developer was not found.",
    })
  }

  if (payload.tenureTypeId && !(await lookupExists(tenureTypes, payload.tenureTypeId))) {
    return buildFailure("LOOKUP_NOT_FOUND", "Tenure type was not found.", {
      tenureTypeId: "Tenure type was not found.",
    })
  }

  if (payload.projectStatusId && !(await lookupExists(projectStatuses, payload.projectStatusId))) {
    return buildFailure("LOOKUP_NOT_FOUND", "Project status was not found.", {
      projectStatusId: "Project status was not found.",
    })
  }

  if (payload.propertyCategoryId && !(await lookupExists(propertyCategories, payload.propertyCategoryId))) {
    return buildFailure("LOOKUP_NOT_FOUND", "Property category was not found.", {
      propertyCategoryId: "Property category was not found.",
    })
  }

  if (payload.propertyTypeId && !(await lookupExists(propertyTypes, payload.propertyTypeId))) {
    return buildFailure("LOOKUP_NOT_FOUND", "Property type was not found.", {
      propertyTypeId: "Property type was not found.",
    })
  }

  if (payload.titleTypeId && !(await lookupExists(titleTypes, payload.titleTypeId))) {
    return buildFailure("LOOKUP_NOT_FOUND", "Title type was not found.", {
      titleTypeId: "Title type was not found.",
    })
  }

  if (payload.regionId && !(await lookupExists(regions, payload.regionId))) {
    return buildFailure("LOOKUP_NOT_FOUND", "Region was not found.", {
      regionId: "Region was not found.",
    })
  }

  if (payload.areaId && !(await lookupExists(areas, payload.areaId))) {
    return buildFailure("LOOKUP_NOT_FOUND", "Area was not found.", {
      areaId: "Area was not found.",
    })
  }

  if (payload.featuredFileId && !(await lookupExists(files, payload.featuredFileId))) {
    return buildFailure("LOOKUP_NOT_FOUND", "Featured file was not found.", {
      featuredFileId: "Featured file was not found.",
    })
  }

  try {
    const rows = await db
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
      })

    const updated = rows[0]
    if (!updated) {
      return buildFailure("UPDATE_FAILED", "Project could not be updated.")
    }

    // Audit logging is intentionally deferred to Phase 2D.6.
    return {
      ok: true,
      projectId: updated.id,
      slug: updated.slug,
    }
  } catch {
    return buildFailure("UPDATE_FAILED", "Project could not be updated.")
  }
}
