import { createProjectSlug, normalizeSlug } from "@/lib/admin/projects/slug"

type ValidationMode = "create" | "update"

type StringField = "name" | "slug" | "developerId" | "projectStatusId" | "tenureTypeId" | "propertyCategoryId" | "propertyTypeId" | "titleTypeId" | "regionId" | "areaId" | "featuredFileId"
type OptionalFkField = "propertyCategoryId" | "propertyTypeId" | "titleTypeId" | "regionId" | "areaId" | "featuredFileId"
type NullableTextField = "displayName" | "legalName" | "description" | "address"

export type ProjectMutationInput = {
  projectId?: unknown
  name?: unknown
  slug?: unknown
  displayName?: unknown
  legalName?: unknown
  description?: unknown
  developerId?: unknown
  propertyCategoryId?: unknown
  propertyTypeId?: unknown
  projectStatusId?: unknown
  tenureTypeId?: unknown
  titleTypeId?: unknown
  regionId?: unknown
  areaId?: unknown
  address?: unknown
  latitude?: unknown
  longitude?: unknown
  landAreaAcres?: unknown
  totalUnits?: unknown
  launchYear?: unknown
  isPublished?: unknown
  featuredFileId?: unknown
}

export type ProjectFieldErrors = Partial<Record<string, string>>

export type NormalizedProjectPayload = {
  projectId?: string
  name?: string
  slug?: string
  displayName?: string | null
  legalName?: string | null
  description?: string | null
  developerId?: string
  propertyCategoryId?: string | null
  propertyTypeId?: string | null
  projectStatusId?: string
  tenureTypeId?: string
  titleTypeId?: string | null
  regionId?: string | null
  areaId?: string | null
  address?: string | null
  latitude?: string | null
  longitude?: string | null
  landAreaAcres?: string | null
  totalUnits?: number
  launchYear?: number | null
  isPublished?: boolean
  featuredFileId?: string | null
}

export type ProjectValidationResult =
  | {
      ok: true
      payload: NormalizedProjectPayload
    }
  | {
      ok: false
      fieldErrors: ProjectFieldErrors
    }

function normalizeRequiredString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null
  }

  const normalized = value.trim()
  return normalized ? normalized : null
}

function normalizeOptionalString(value: unknown): string | undefined {
  if (value === undefined) {
    return undefined
  }

  if (value === null) {
    return ""
  }

  if (typeof value !== "string") {
    return undefined
  }

  return value.trim()
}

function normalizeNullableText(value: unknown): string | null | undefined {
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

function normalizeOptionalBoolean(value: unknown): boolean | undefined {
  if (value === undefined) {
    return undefined
  }

  if (typeof value === "boolean") {
    return value
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase()
    if (normalized === "true") {
      return true
    }

    if (normalized === "false") {
      return false
    }
  }

  return undefined
}

function normalizeNumeric(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined
  }

  if (typeof value === "string") {
    const normalized = Number.parseFloat(value.trim())
    return Number.isFinite(normalized) ? normalized : undefined
  }

  return undefined
}

function normalizeInteger(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value) || !Number.isInteger(value)) {
      return undefined
    }

    return value
  }

  if (typeof value === "string") {
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

  return undefined
}

function addError(fieldErrors: ProjectFieldErrors, field: string, message: string) {
  if (!fieldErrors[field]) {
    fieldErrors[field] = message
  }
}

export function validateProjectMutationInput(
  input: ProjectMutationInput,
  mode: ValidationMode,
): ProjectValidationResult {
  const fieldErrors: ProjectFieldErrors = {}
  const payload: NormalizedProjectPayload = {}
  const currentYear = new Date().getUTCFullYear()

  if (mode === "update") {
    const projectId = normalizeRequiredString(input.projectId)
    if (!projectId) {
      addError(fieldErrors, "projectId", "Project id is required.")
    } else {
      payload.projectId = projectId
    }
  }

  const name = normalizeOptionalString(input.name)
  if (mode === "create") {
    if (!name) {
      addError(fieldErrors, "name", "Project name is required.")
    } else {
      payload.name = name
    }
  } else if (name !== undefined) {
    if (!name) {
      addError(fieldErrors, "name", "Project name cannot be empty.")
    } else {
      payload.name = name
    }
  }

  const slugInput = normalizeOptionalString(input.slug)
  if (mode === "create") {
    const slugSource = slugInput && slugInput.length > 0 ? slugInput : (payload.name ?? "")
    const generatedSlug = createProjectSlug(slugSource)
    if (!generatedSlug) {
      addError(fieldErrors, "slug", "Slug is required.")
    } else {
      payload.slug = generatedSlug
    }
  } else if (slugInput !== undefined) {
    const normalizedSlug = normalizeSlug(slugInput)
    if (!normalizedSlug) {
      addError(fieldErrors, "slug", "Slug cannot be empty.")
    } else {
      payload.slug = normalizedSlug
    }
  }

  const requiredCreateFields: readonly StringField[] = ["developerId", "projectStatusId", "tenureTypeId"]
  for (const field of requiredCreateFields) {
    const normalized = normalizeOptionalString(input[field])
    if (mode === "create") {
      if (!normalized) {
        addError(fieldErrors, field, `${field} is required.`)
      } else {
        payload[field] = normalized
      }
      continue
    }

    if (normalized !== undefined) {
      if (!normalized) {
        addError(fieldErrors, field, `${field} cannot be empty.`)
      } else {
        payload[field] = normalized
      }
    }
  }

  const optionalFkFields: readonly OptionalFkField[] = [
    "propertyCategoryId",
    "propertyTypeId",
    "titleTypeId",
    "regionId",
    "areaId",
    "featuredFileId",
  ]

  for (const field of optionalFkFields) {
    const normalized = normalizeOptionalString(input[field])
    if (normalized === undefined) {
      continue
    }

    payload[field] = normalized ? normalized : null
  }

  const nullableTextFields: readonly NullableTextField[] = ["displayName", "legalName", "description", "address"]
  for (const field of nullableTextFields) {
    const normalized = normalizeNullableText(input[field])
    if (normalized !== undefined) {
      payload[field] = normalized
    }
  }

  const totalUnits = normalizeInteger(input.totalUnits)
  if (input.totalUnits !== undefined && input.totalUnits !== null && input.totalUnits !== "" && totalUnits === undefined) {
    addError(fieldErrors, "totalUnits", "Total units must be an integer.")
  }

  if (mode === "create") {
    payload.totalUnits = totalUnits === undefined ? 0 : totalUnits
  } else if (totalUnits !== undefined) {
    payload.totalUnits = totalUnits
  }

  if (payload.totalUnits !== undefined && payload.totalUnits < 0) {
    addError(fieldErrors, "totalUnits", "Total units must be 0 or greater.")
  }

  const launchYear = normalizeInteger(input.launchYear)
  if (input.launchYear !== undefined && input.launchYear !== null && input.launchYear !== "" && launchYear === undefined) {
    addError(fieldErrors, "launchYear", "Launch year must be an integer.")
  }

  if (launchYear !== undefined) {
    if (launchYear < 1900 || launchYear > currentYear + 10) {
      addError(fieldErrors, "launchYear", `Launch year must be between 1900 and ${currentYear + 10}.`)
    } else {
      payload.launchYear = launchYear
    }
  } else if (input.launchYear !== undefined) {
    payload.launchYear = null
  }

  const landAreaAcres = normalizeNumeric(input.landAreaAcres)
  if (landAreaAcres !== undefined) {
    if (landAreaAcres < 0) {
      addError(fieldErrors, "landAreaAcres", "Land area must be 0 or greater.")
    } else {
      payload.landAreaAcres = String(landAreaAcres)
    }
  } else if (input.landAreaAcres !== undefined) {
    payload.landAreaAcres = null
  }

  const latitude = normalizeNumeric(input.latitude)
  if (latitude !== undefined) {
    if (latitude < -90 || latitude > 90) {
      addError(fieldErrors, "latitude", "Latitude must be between -90 and 90.")
    } else {
      payload.latitude = String(latitude)
    }
  } else if (input.latitude !== undefined) {
    payload.latitude = null
  }

  const longitude = normalizeNumeric(input.longitude)
  if (longitude !== undefined) {
    if (longitude < -180 || longitude > 180) {
      addError(fieldErrors, "longitude", "Longitude must be between -180 and 180.")
    } else {
      payload.longitude = String(longitude)
    }
  } else if (input.longitude !== undefined) {
    payload.longitude = null
  }

  const isPublished = normalizeOptionalBoolean(input.isPublished)
  if (mode === "create") {
    payload.isPublished = isPublished ?? false
  } else if (isPublished !== undefined) {
    payload.isPublished = isPublished
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      fieldErrors,
    }
  }

  if (mode === "update") {
    const updateKeys = Object.keys(payload).filter((key) => key !== "projectId")
    if (updateKeys.length === 0) {
      return {
        ok: false,
        fieldErrors: {
          form: "Provide at least one field to update.",
        },
      }
    }
  }

  return {
    ok: true,
    payload,
  }
}
