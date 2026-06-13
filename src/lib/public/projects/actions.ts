import "server-only"

import {
  and,
  asc,
  desc,
  eq,
  ilike,
  isNull,
  ne,
  or,
  sql,
  type SQL,
} from "drizzle-orm"

import { db } from "@/db"
import {
  developers,
  projectLayouts,
  projectMedia,
  projectNearbyPlaces,
  projects,
} from "@/db/schema/catalog"
import { files } from "@/db/schema/files"
import { areas, regions } from "@/db/schema/geo"
import { units } from "@/db/schema/inventory"
import {
  mediaTypes,
  projectStatuses,
  propertyCategories,
  propertyTypes,
  tenureTypes,
  titleTypes,
} from "@/db/schema/lookups"

export type PublicProjectFilterOption = {
  id: string
  name: string
}

export type PublicProjectOption = {
  id: string
  slug: string
  name: string
}

export type PublicProjectListParams = {
  search?: string
  page?: number
  pageSize?: number
  propertyCategoryId?: string
  projectStatusId?: string
  regionId?: string
}

export type PublicProjectListItem = {
  id: string
  slug: string
  name: string
  displayName: string | null
  description: string | null
  projectStatusName: string | null
  propertyCategoryName: string | null
  propertyTypeName: string | null
  regionName: string | null
  areaName: string | null
  totalUnits: number
  launchYear: number | null
  isHotDeal: boolean
  featuredImageUrl: string | null
  minStartingPrice: string | null
  maxStartingPrice: string | null
  updatedAt: string
}

export type PublicProjectListResult = {
  items: PublicProjectListItem[]
  total: number
  page: number
  pageSize: number
  search: string
  filters: {
    propertyCategoryId: string
    projectStatusId: string
    regionId: string
  }
  options: {
    categories: PublicProjectFilterOption[]
    statuses: PublicProjectFilterOption[]
    regions: PublicProjectFilterOption[]
  }
}

export type PublicProjectLayoutItem = {
  id: string
  code: string
  name: string | null
  bedrooms: number
  bathrooms: number
  studyRooms: number
  builtUpSqft: string
  hasBalcony: boolean
  hasYard: boolean
  isDualKey: boolean
}

export type PublicProjectMediaItem = {
  id: string
  fileId: string
  fileUrl: string | null
  fileKey: string | null
  caption: string | null
  mediaTypeName: string | null
  sortOrder: number
}

export type PublicProjectNearbyPlaceItem = {
  id: string
  name: string
  category: string
  distanceKm: string | null
}

export type PublicProjectDetail = {
  id: string
  slug: string
  name: string
  displayName: string | null
  legalName: string | null
  description: string | null
  developerName: string | null
  developerLegalName: string | null
  projectStatusName: string | null
  propertyCategoryName: string | null
  propertyTypeName: string | null
  tenureTypeName: string | null
  titleTypeName: string | null
  regionName: string | null
  areaName: string | null
  address: string | null
  totalUnits: number
  launchYear: number | null
  isForeignerEligible: boolean
  isHotDeal: boolean
  bookingFee: string | null
  bookingFeeBumi: string | null
  maintenanceFeePerSqft: string | null
  sinkingFundPerSqft: string | null
  landAreaAcres: string | null
  latitude: string | null
  longitude: string | null
  featuredImageUrl: string | null
  minStartingPrice: string | null
  maxStartingPrice: string | null
  updatedAt: string
  layouts: PublicProjectLayoutItem[]
  media: PublicProjectMediaItem[]
  nearbyPlaces: PublicProjectNearbyPlaceItem[]
  similarProjects: PublicProjectListItem[]
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

function normalizeOptionalId(value: unknown): string {
  if (typeof value !== "string") {
    return ""
  }

  return value.trim()
}

function normalizeSlug(value: unknown): string {
  if (typeof value !== "string") {
    return ""
  }

  return value.trim().toLowerCase()
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

function mapPublicProjectListItem(row: {
  id: string
  slug: string
  name: string
  displayName: string | null
  description: string | null
  projectStatusName: string | null
  propertyCategoryName: string | null
  propertyTypeName: string | null
  regionName: string | null
  areaName: string | null
  totalUnits: number
  launchYear: number | null
  isHotDeal: boolean
  featuredImageUrl: string | null
  minStartingPrice: string | null
  maxStartingPrice: string | null
  updatedAt: Date
}): PublicProjectListItem {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    displayName: row.displayName,
    description: row.description,
    projectStatusName: row.projectStatusName,
    propertyCategoryName: row.propertyCategoryName,
    propertyTypeName: row.propertyTypeName,
    regionName: row.regionName,
    areaName: row.areaName,
    totalUnits: row.totalUnits,
    launchYear: row.launchYear,
    isHotDeal: row.isHotDeal,
    featuredImageUrl: row.featuredImageUrl,
    minStartingPrice: row.minStartingPrice,
    maxStartingPrice: row.maxStartingPrice,
    updatedAt: row.updatedAt.toISOString(),
  }
}

function buildPublishedProjectClauses(): SQL<unknown>[] {
  return [
    eq(projects.isPublished, true),
    eq(projects.isActive, true),
    isNull(projects.deletedAt),
  ]
}

export async function listPublicProjects(
  params: PublicProjectListParams = {},
): Promise<PublicProjectListResult> {
  const search = normalizeSearch(params.search)
  const page = normalizePositiveInt(params.page, 1, 500)
  const pageSize = normalizePositiveInt(params.pageSize, 9, 60)
  const propertyCategoryId = normalizeOptionalId(params.propertyCategoryId)
  const projectStatusId = normalizeOptionalId(params.projectStatusId)
  const regionId = normalizeOptionalId(params.regionId)

  const emptyResult: PublicProjectListResult = {
    items: [],
    total: 0,
    page,
    pageSize,
    search,
    filters: {
      propertyCategoryId,
      projectStatusId,
      regionId,
    },
    options: {
      categories: [],
      statuses: [],
      regions: [],
    },
  }

  if (!db) {
    return emptyResult
  }

  const whereClauses = buildPublishedProjectClauses()

  if (propertyCategoryId) {
    whereClauses.push(eq(projects.propertyCategoryId, propertyCategoryId))
  }

  if (projectStatusId) {
    whereClauses.push(eq(projects.projectStatusId, projectStatusId))
  }

  if (regionId) {
    whereClauses.push(eq(projects.regionId, regionId))
  }

  if (search) {
    const searchPattern = `%${search}%`
    whereClauses.push(
      or(
        ilike(projects.name, searchPattern),
        ilike(projects.displayName, searchPattern),
        ilike(projects.description, searchPattern),
        ilike(areas.name, searchPattern),
        ilike(regions.name, searchPattern),
      )!,
    )
  }

  const whereExpression = buildWhereExpression(whereClauses)

  const [countRows, categoryRows, statusRows, regionRows] = await Promise.all([
    db
      .select({
        total: sql<number>`count(distinct ${projects.id})`,
      })
      .from(projects)
      .leftJoin(areas, eq(projects.areaId, areas.id))
      .leftJoin(regions, eq(projects.regionId, regions.id))
      .where(whereExpression),
    db
      .select({ id: propertyCategories.id, name: propertyCategories.name })
      .from(propertyCategories)
      .where(and(eq(propertyCategories.isActive, true), isNull(propertyCategories.deletedAt)))
      .orderBy(asc(propertyCategories.sortOrder), asc(propertyCategories.name)),
    db
      .select({ id: projectStatuses.id, name: projectStatuses.name })
      .from(projectStatuses)
      .where(and(eq(projectStatuses.isActive, true), isNull(projectStatuses.deletedAt)))
      .orderBy(asc(projectStatuses.sortOrder), asc(projectStatuses.name)),
    db
      .select({ id: regions.id, name: regions.name })
      .from(regions)
      .where(isNull(regions.deletedAt))
      .orderBy(asc(regions.name)),
  ])

  const total = countRows[0]?.total ?? 0

  const rows = await db
    .select({
      id: projects.id,
      slug: projects.slug,
      name: projects.name,
      displayName: projects.displayName,
      description: projects.description,
      projectStatusName: projectStatuses.name,
      propertyCategoryName: propertyCategories.name,
      propertyTypeName: propertyTypes.name,
      regionName: regions.name,
      areaName: areas.name,
      totalUnits: projects.totalUnits,
      launchYear: projects.launchYear,
      isHotDeal: projects.isHotDeal,
      featuredImageUrl: files.url,
      minStartingPrice: sql<string | null>`min(coalesce(${units.finalPrice}, ${units.basePrice}))`,
      maxStartingPrice: sql<string | null>`max(coalesce(${units.finalPrice}, ${units.basePrice}))`,
      updatedAt: projects.updatedAt,
    })
    .from(projects)
    .leftJoin(projectStatuses, eq(projects.projectStatusId, projectStatuses.id))
    .leftJoin(propertyCategories, eq(projects.propertyCategoryId, propertyCategories.id))
    .leftJoin(propertyTypes, eq(projects.propertyTypeId, propertyTypes.id))
    .leftJoin(regions, eq(projects.regionId, regions.id))
    .leftJoin(areas, eq(projects.areaId, areas.id))
    .leftJoin(files, and(eq(projects.featuredFileId, files.id), isNull(files.deletedAt)))
    .leftJoin(units, and(eq(units.projectId, projects.id), isNull(units.deletedAt)))
    .where(whereExpression)
    .groupBy(
      projects.id,
      projects.slug,
      projects.name,
      projects.displayName,
      projects.description,
      projectStatuses.name,
      propertyCategories.name,
      propertyTypes.name,
      regions.name,
      areas.name,
      projects.totalUnits,
      projects.launchYear,
      projects.isHotDeal,
      files.url,
      projects.updatedAt,
    )
    .orderBy(desc(projects.isHotDeal), desc(projects.updatedAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize)

  return {
    items: rows.map((row) => mapPublicProjectListItem(row)),
    total: Number(total),
    page,
    pageSize,
    search,
    filters: {
      propertyCategoryId,
      projectStatusId,
      regionId,
    },
    options: {
      categories: categoryRows,
      statuses: statusRows,
      regions: regionRows,
    },
  }
}

export async function listFeaturedPublicProjects(limit = 3): Promise<PublicProjectListItem[]> {
  if (!db) {
    return []
  }

  const safeLimit = normalizePositiveInt(limit, 3, 12)

  const rows = await db
    .select({
      id: projects.id,
      slug: projects.slug,
      name: projects.name,
      displayName: projects.displayName,
      description: projects.description,
      projectStatusName: projectStatuses.name,
      propertyCategoryName: propertyCategories.name,
      propertyTypeName: propertyTypes.name,
      regionName: regions.name,
      areaName: areas.name,
      totalUnits: projects.totalUnits,
      launchYear: projects.launchYear,
      isHotDeal: projects.isHotDeal,
      featuredImageUrl: files.url,
      minStartingPrice: sql<string | null>`min(coalesce(${units.finalPrice}, ${units.basePrice}))`,
      maxStartingPrice: sql<string | null>`max(coalesce(${units.finalPrice}, ${units.basePrice}))`,
      updatedAt: projects.updatedAt,
    })
    .from(projects)
    .leftJoin(projectStatuses, eq(projects.projectStatusId, projectStatuses.id))
    .leftJoin(propertyCategories, eq(projects.propertyCategoryId, propertyCategories.id))
    .leftJoin(propertyTypes, eq(projects.propertyTypeId, propertyTypes.id))
    .leftJoin(regions, eq(projects.regionId, regions.id))
    .leftJoin(areas, eq(projects.areaId, areas.id))
    .leftJoin(files, and(eq(projects.featuredFileId, files.id), isNull(files.deletedAt)))
    .leftJoin(units, and(eq(units.projectId, projects.id), isNull(units.deletedAt)))
    .where(buildWhereExpression(buildPublishedProjectClauses()))
    .groupBy(
      projects.id,
      projects.slug,
      projects.name,
      projects.displayName,
      projects.description,
      projectStatuses.name,
      propertyCategories.name,
      propertyTypes.name,
      regions.name,
      areas.name,
      projects.totalUnits,
      projects.launchYear,
      projects.isHotDeal,
      files.url,
      projects.updatedAt,
    )
    .orderBy(desc(projects.isHotDeal), desc(projects.updatedAt))
    .limit(safeLimit)

  return rows.map((row) => mapPublicProjectListItem(row))
}

export async function listPublicProjectOptions(limit = 200): Promise<PublicProjectOption[]> {
  if (!db) {
    return []
  }

  const safeLimit = normalizePositiveInt(limit, 200, 1000)

  const rows = await db
    .select({
      id: projects.id,
      slug: projects.slug,
      name: projects.name,
    })
    .from(projects)
    .where(buildWhereExpression(buildPublishedProjectClauses()))
    .orderBy(asc(projects.name))
    .limit(safeLimit)

  return rows
}

export async function getPublicProjectBySlug(slug: string): Promise<PublicProjectDetail | null> {
  const normalizedSlug = normalizeSlug(slug)
  if (!normalizedSlug || !db) {
    return null
  }

  const detailRows = await db
    .select({
      id: projects.id,
      slug: projects.slug,
      name: projects.name,
      displayName: projects.displayName,
      legalName: projects.legalName,
      description: projects.description,
      developerName: developers.name,
      developerLegalName: developers.legalName,
      projectStatusName: projectStatuses.name,
      propertyCategoryName: propertyCategories.name,
      propertyTypeName: propertyTypes.name,
      tenureTypeName: tenureTypes.name,
      titleTypeName: titleTypes.name,
      propertyCategoryId: projects.propertyCategoryId,
      regionId: projects.regionId,
      areaName: areas.name,
      regionName: regions.name,
      address: projects.address,
      totalUnits: projects.totalUnits,
      launchYear: projects.launchYear,
      isForeignerEligible: projects.isForeignerEligible,
      isHotDeal: projects.isHotDeal,
      bookingFee: projects.bookingFee,
      bookingFeeBumi: projects.bookingFeeBumi,
      maintenanceFeePerSqft: projects.maintenanceFeePerSqft,
      sinkingFundPerSqft: projects.sinkingFundPerSqft,
      landAreaAcres: projects.landAreaAcres,
      latitude: projects.latitude,
      longitude: projects.longitude,
      featuredImageUrl: files.url,
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
    .leftJoin(files, and(eq(projects.featuredFileId, files.id), isNull(files.deletedAt)))
    .where(
      and(
        ...buildPublishedProjectClauses(),
        eq(projects.slug, normalizedSlug),
      ),
    )
    .limit(1)

  const project = detailRows[0]
  if (!project) {
    return null
  }

  const [priceRows, layoutRows, mediaRows, nearbyRows] = await Promise.all([
    db
      .select({
        minStartingPrice: sql<string | null>`min(coalesce(${units.finalPrice}, ${units.basePrice}))`,
        maxStartingPrice: sql<string | null>`max(coalesce(${units.finalPrice}, ${units.basePrice}))`,
      })
      .from(units)
      .where(and(eq(units.projectId, project.id), isNull(units.deletedAt))),
    db
      .select({
        id: projectLayouts.id,
        code: projectLayouts.code,
        name: projectLayouts.name,
        bedrooms: projectLayouts.bedrooms,
        bathrooms: projectLayouts.bathrooms,
        studyRooms: projectLayouts.studyRooms,
        builtUpSqft: projectLayouts.builtUpSqft,
        hasBalcony: projectLayouts.hasBalcony,
        hasYard: projectLayouts.hasYard,
        isDualKey: projectLayouts.isDualKey,
      })
      .from(projectLayouts)
      .where(and(eq(projectLayouts.projectId, project.id), isNull(projectLayouts.deletedAt)))
      .orderBy(asc(projectLayouts.bedrooms), asc(projectLayouts.builtUpSqft), asc(projectLayouts.code))
      .limit(20),
    db
      .select({
        id: projectMedia.id,
        fileId: projectMedia.fileId,
        fileUrl: files.url,
        fileKey: files.key,
        caption: projectMedia.caption,
        mediaTypeName: mediaTypes.name,
        sortOrder: projectMedia.sortOrder,
      })
      .from(projectMedia)
      .leftJoin(files, and(eq(projectMedia.fileId, files.id), isNull(files.deletedAt)))
      .leftJoin(mediaTypes, eq(projectMedia.mediaTypeId, mediaTypes.id))
      .where(and(eq(projectMedia.projectId, project.id), isNull(projectMedia.deletedAt)))
      .orderBy(asc(projectMedia.sortOrder), asc(projectMedia.createdAt))
      .limit(30),
    db
      .select({
        id: projectNearbyPlaces.id,
        name: projectNearbyPlaces.name,
        category: projectNearbyPlaces.category,
        distanceKm: projectNearbyPlaces.distanceKm,
      })
      .from(projectNearbyPlaces)
      .where(and(eq(projectNearbyPlaces.projectId, project.id), isNull(projectNearbyPlaces.deletedAt)))
      .orderBy(asc(projectNearbyPlaces.sortOrder), asc(projectNearbyPlaces.name))
      .limit(30),
  ])

  const similarWhereClauses = [
    ...buildPublishedProjectClauses(),
    ne(projects.id, project.id),
  ]

  if (project.regionId) {
    similarWhereClauses.push(eq(projects.regionId, project.regionId))
  } else if (project.propertyCategoryId) {
    similarWhereClauses.push(eq(projects.propertyCategoryId, project.propertyCategoryId))
  }

  const similarRows = await db
    .select({
      id: projects.id,
      slug: projects.slug,
      name: projects.name,
      displayName: projects.displayName,
      description: projects.description,
      projectStatusName: projectStatuses.name,
      propertyCategoryName: propertyCategories.name,
      propertyTypeName: propertyTypes.name,
      regionName: regions.name,
      areaName: areas.name,
      totalUnits: projects.totalUnits,
      launchYear: projects.launchYear,
      isHotDeal: projects.isHotDeal,
      featuredImageUrl: files.url,
      minStartingPrice: sql<string | null>`min(coalesce(${units.finalPrice}, ${units.basePrice}))`,
      maxStartingPrice: sql<string | null>`max(coalesce(${units.finalPrice}, ${units.basePrice}))`,
      updatedAt: projects.updatedAt,
    })
    .from(projects)
    .leftJoin(projectStatuses, eq(projects.projectStatusId, projectStatuses.id))
    .leftJoin(propertyCategories, eq(projects.propertyCategoryId, propertyCategories.id))
    .leftJoin(propertyTypes, eq(projects.propertyTypeId, propertyTypes.id))
    .leftJoin(regions, eq(projects.regionId, regions.id))
    .leftJoin(areas, eq(projects.areaId, areas.id))
    .leftJoin(files, and(eq(projects.featuredFileId, files.id), isNull(files.deletedAt)))
    .leftJoin(units, and(eq(units.projectId, projects.id), isNull(units.deletedAt)))
    .where(buildWhereExpression(similarWhereClauses))
    .groupBy(
      projects.id,
      projects.slug,
      projects.name,
      projects.displayName,
      projects.description,
      projectStatuses.name,
      propertyCategories.name,
      propertyTypes.name,
      regions.name,
      areas.name,
      projects.totalUnits,
      projects.launchYear,
      projects.isHotDeal,
      files.url,
      projects.updatedAt,
    )
    .orderBy(desc(projects.isHotDeal), desc(projects.updatedAt))
    .limit(3)

  return {
    id: project.id,
    slug: project.slug,
    name: project.name,
    displayName: project.displayName,
    legalName: project.legalName,
    description: project.description,
    developerName: project.developerName,
    developerLegalName: project.developerLegalName,
    projectStatusName: project.projectStatusName,
    propertyCategoryName: project.propertyCategoryName,
    propertyTypeName: project.propertyTypeName,
    tenureTypeName: project.tenureTypeName,
    titleTypeName: project.titleTypeName,
    regionName: project.regionName,
    areaName: project.areaName,
    address: project.address,
    totalUnits: project.totalUnits,
    launchYear: project.launchYear,
    isForeignerEligible: project.isForeignerEligible,
    isHotDeal: project.isHotDeal,
    bookingFee: project.bookingFee,
    bookingFeeBumi: project.bookingFeeBumi,
    maintenanceFeePerSqft: project.maintenanceFeePerSqft,
    sinkingFundPerSqft: project.sinkingFundPerSqft,
    landAreaAcres: project.landAreaAcres,
    latitude: project.latitude,
    longitude: project.longitude,
    featuredImageUrl: project.featuredImageUrl,
    minStartingPrice: priceRows[0]?.minStartingPrice ?? null,
    maxStartingPrice: priceRows[0]?.maxStartingPrice ?? null,
    updatedAt: project.updatedAt.toISOString(),
    layouts: layoutRows.map((layout) => ({
      id: layout.id,
      code: layout.code,
      name: layout.name,
      bedrooms: layout.bedrooms,
      bathrooms: layout.bathrooms,
      studyRooms: layout.studyRooms,
      builtUpSqft: layout.builtUpSqft,
      hasBalcony: layout.hasBalcony,
      hasYard: layout.hasYard,
      isDualKey: layout.isDualKey,
    })),
    media: mediaRows,
    nearbyPlaces: nearbyRows,
    similarProjects: similarRows.map((row) => mapPublicProjectListItem(row)),
  }
}
