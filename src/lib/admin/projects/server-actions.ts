"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { ROUTES } from "@/config/routes"
import {
  attachAdminProjectMedia,
  createAdminProject,
  removeAdminProjectMedia,
  updateAdminProject,
  type AdminProjectMediaMutationFailureCode,
  type AdminProjectMutationFailureCode,
} from "@/lib/admin/projects/actions"
import {
  buildAttachProjectMediaInputFromFormData,
  buildProjectMutationInputFromFormData,
  buildRemoveProjectMediaInputFromFormData,
} from "@/lib/admin/projects/form-parser"
import type { ProjectFieldErrors } from "@/lib/admin/projects/validation"

export type ProjectFormActionState = {
  code?: AdminProjectMutationFailureCode
  message?: string
  fieldErrors: ProjectFieldErrors
}

export type ProjectMediaActionState = {
  code?: AdminProjectMediaMutationFailureCode
  message?: string
  fieldErrors: ProjectFieldErrors
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

function toProjectMediaActionState(
  code: AdminProjectMediaMutationFailureCode,
  message: string,
  fieldErrors?: ProjectFieldErrors,
): ProjectMediaActionState {
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
  const result = await createAdminProject(buildProjectMutationInputFromFormData(formData))

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
  const result = await updateAdminProject(buildProjectMutationInputFromFormData(formData))

  if (result.ok) {
    revalidatePath(ROUTES.admin.projects)
    redirect(ROUTES.admin.projects)
  }

  return toFormActionState(result.code, result.message, result.fieldErrors)
}

export async function attachAdminProjectMediaAction(
  _prevState: ProjectMediaActionState,
  formData: FormData,
): Promise<ProjectMediaActionState> {
  const result = await attachAdminProjectMedia(buildAttachProjectMediaInputFromFormData(formData))

  if (result.ok) {
    revalidatePath(ROUTES.admin.projects)
    revalidatePath(ROUTES.admin.projectEdit(result.projectId))
    redirect(ROUTES.admin.projectEdit(result.projectId))
  }

  return toProjectMediaActionState(result.code, result.message, result.fieldErrors)
}

export async function removeAdminProjectMediaAction(
  _prevState: ProjectMediaActionState,
  formData: FormData,
): Promise<ProjectMediaActionState> {
  const result = await removeAdminProjectMedia(buildRemoveProjectMediaInputFromFormData(formData))

  if (result.ok) {
    revalidatePath(ROUTES.admin.projects)
    revalidatePath(ROUTES.admin.projectEdit(result.projectId))
    redirect(ROUTES.admin.projectEdit(result.projectId))
  }

  return toProjectMediaActionState(result.code, result.message, result.fieldErrors)
}
