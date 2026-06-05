"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { ROUTES } from "@/config/routes"
import {
  createAdminProject,
  updateAdminProject,
  type AdminProjectMutationFailureCode,
} from "@/lib/admin/projects/actions"
import type { ProjectFieldErrors, ProjectMutationInput } from "@/lib/admin/projects/validation"

export type ProjectFormActionState = {
  code?: AdminProjectMutationFailureCode
  message?: string
  fieldErrors: ProjectFieldErrors
}

export const INITIAL_PROJECT_FORM_ACTION_STATE: ProjectFormActionState = {
  fieldErrors: {},
}

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

function buildProjectMutationInput(formData: FormData): ProjectMutationInput {
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
    address: getTextValue(formData, "address"),
    latitude: getTextValue(formData, "latitude"),
    longitude: getTextValue(formData, "longitude"),
    landAreaAcres: getTextValue(formData, "landAreaAcres"),
    totalUnits: getTextValue(formData, "totalUnits"),
    launchYear: getTextValue(formData, "launchYear"),
    isPublished: getBooleanValue(formData, "isPublished"),
  }
}

function toFormActionState(
  code: AdminProjectMutationFailureCode,
  message: string,
  fieldErrors?: ProjectFieldErrors,
): ProjectFormActionState {
  return {
    code,
    message,
    fieldErrors: fieldErrors ?? {},
  }
}

export async function createAdminProjectAction(
  _prevState: ProjectFormActionState,
  formData: FormData,
): Promise<ProjectFormActionState> {
  const result = await createAdminProject(buildProjectMutationInput(formData))

  if (result.ok) {
    revalidatePath(ROUTES.admin.projects)
    redirect(ROUTES.admin.projects)
  }

  return toFormActionState(result.code, result.message, result.fieldErrors)
}

export async function updateAdminProjectAction(
  _prevState: ProjectFormActionState,
  formData: FormData,
): Promise<ProjectFormActionState> {
  const result = await updateAdminProject(buildProjectMutationInput(formData))

  if (result.ok) {
    revalidatePath(ROUTES.admin.projects)
    redirect(ROUTES.admin.projects)
  }

  return toFormActionState(result.code, result.message, result.fieldErrors)
}
