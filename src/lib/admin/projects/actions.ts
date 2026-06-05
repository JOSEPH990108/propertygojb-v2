import "server-only"

import { and, asc, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm"

import { ROUTES } from "@/config/routes"
import { db } from "@/db"
import { developers, projects } from "@/db/schema/catalog"
import { areas, regions } from "@/db/schema/geo"
import {
  projectStatuses,
  propertyCategories,
  propertyTypes,
  tenureTypes,
  titleTypes,
} from "@/db/schema/lookups"
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
