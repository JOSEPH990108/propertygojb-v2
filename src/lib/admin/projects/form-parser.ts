import type {
  AttachAdminProjectMediaInput,
  RemoveAdminProjectMediaInput,
} from "@/lib/admin/projects/actions"
import type { ProjectMutationInput } from "@/lib/admin/projects/validation"

function getTextValue(formData: FormData, key: string): string | undefined {
  const value = formData.get(key)
  return typeof value === "string" ? value : undefined
}

function getBooleanValue(formData: FormData, key: string): boolean | undefined {
  const values = formData.getAll(key)
  const raw = values[values.length - 1]

  if (typeof raw !== "string") {
    return undefined
  }

  const normalized = raw.trim().toLowerCase()
  if (normalized === "true" || normalized === "1" || normalized === "on") {
    return true
  }

  if (normalized === "false" || normalized === "0" || normalized === "off" || normalized === "") {
    return false
  }

  return undefined
}

export function buildProjectMutationInputFromFormData(formData: FormData): ProjectMutationInput {
  return {
    projectId: getTextValue(formData, "projectId"),
    name: getTextValue(formData, "name"),
    slug: getTextValue(formData, "slug"),
    displayName: getTextValue(formData, "displayName"),
    legalName: getTextValue(formData, "legalName"),
    description: getTextValue(formData, "description"),
    developerId: getTextValue(formData, "developerId"),
    projectStatusId: getTextValue(formData, "projectStatusId"),
    tenureTypeId: getTextValue(formData, "tenureTypeId"),
    propertyCategoryId: getTextValue(formData, "propertyCategoryId"),
    propertyTypeId: getTextValue(formData, "propertyTypeId"),
    titleTypeId: getTextValue(formData, "titleTypeId"),
    regionId: getTextValue(formData, "regionId"),
    areaId: getTextValue(formData, "areaId"),
    featuredFileId: getTextValue(formData, "featuredFileId"),
    address: getTextValue(formData, "address"),
    latitude: getTextValue(formData, "latitude"),
    longitude: getTextValue(formData, "longitude"),
    landAreaAcres: getTextValue(formData, "landAreaAcres"),
    totalUnits: getTextValue(formData, "totalUnits"),
    launchYear: getTextValue(formData, "launchYear"),
    isPublished: getBooleanValue(formData, "isPublished"),
  }
}

export function buildAttachProjectMediaInputFromFormData(
  formData: FormData,
): AttachAdminProjectMediaInput {
  return {
    projectId: getTextValue(formData, "projectId"),
    fileId: getTextValue(formData, "fileId"),
    mediaTypeId: getTextValue(formData, "mediaTypeId"),
    caption: getTextValue(formData, "caption"),
    sortOrder: getTextValue(formData, "sortOrder"),
  }
}

export function buildRemoveProjectMediaInputFromFormData(
  formData: FormData,
): RemoveAdminProjectMediaInput {
  return {
    projectId: getTextValue(formData, "projectId"),
    projectMediaId: getTextValue(formData, "projectMediaId"),
  }
}
