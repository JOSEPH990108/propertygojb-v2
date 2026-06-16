"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { ROUTES } from "@/config/routes"
import {
  archiveAdminProperty,
  createAdminProperty,
  updateAdminProperty,
  type AdminPropertyMutationFailureCode,
  type AdminPropertyMutationInput,
  type PropertyFieldErrors,
} from "@/lib/admin/properties/actions"

export type PropertyFormActionState = {
  code?: AdminPropertyMutationFailureCode
  message?: string
  fieldErrors: PropertyFieldErrors
}

const INITIAL_STATE: PropertyFormActionState = {
  fieldErrors: {},
}

function getTextValue(formData: FormData, key: string): string | undefined {
  const value = formData.get(key)
  return typeof value === "string" ? value : undefined
}

function buildPropertyMutationInput(formData: FormData): AdminPropertyMutationInput {
  return {
    propertyId: getTextValue(formData, "propertyId"),
    projectId: getTextValue(formData, "projectId"),
    layoutId: getTextValue(formData, "layoutId"),
    towerId: getTextValue(formData, "towerId"),
    phaseId: getTextValue(formData, "phaseId"),
    unitNo: getTextValue(formData, "unitNo"),
    floor: getTextValue(formData, "floor"),
    stack: getTextValue(formData, "stack"),
    streetName: getTextValue(formData, "streetName"),
    displaySequence: getTextValue(formData, "displaySequence"),
    builtUpSqft: getTextValue(formData, "builtUpSqft"),
    landAreaSqft: getTextValue(formData, "landAreaSqft"),
    dimensionText: getTextValue(formData, "dimensionText"),
    facing: getTextValue(formData, "facing"),
    positionTypeId: getTextValue(formData, "positionTypeId"),
    carparkCount: getTextValue(formData, "carparkCount"),
    carparkLotNo: getTextValue(formData, "carparkLotNo"),
    carparkType: getTextValue(formData, "carparkType"),
    lotTypeId: getTextValue(formData, "lotTypeId"),
    bookingStatusId: getTextValue(formData, "bookingStatusId"),
    basePrice: getTextValue(formData, "basePrice"),
    finalPrice: getTextValue(formData, "finalPrice"),
    reasonNote: getTextValue(formData, "reasonNote"),
  }
}

function toActionState(
  code: AdminPropertyMutationFailureCode,
  message: string,
  fieldErrors?: PropertyFieldErrors,
): PropertyFormActionState {
  return {
    code,
    message,
    fieldErrors: fieldErrors ?? {},
  }
}

export async function createAdminPropertyAction(
  prevState: PropertyFormActionState = INITIAL_STATE,
  formData: FormData,
): Promise<PropertyFormActionState> {
  void prevState
  const result = await createAdminProperty(buildPropertyMutationInput(formData))

  if (result.ok) {
    revalidatePath(ROUTES.admin.properties)
    redirect(ROUTES.admin.properties)
  }

  return toActionState(result.code, result.message, result.fieldErrors)
}

export async function updateAdminPropertyAction(
  prevState: PropertyFormActionState = INITIAL_STATE,
  formData: FormData,
): Promise<PropertyFormActionState> {
  void prevState
  const result = await updateAdminProperty(buildPropertyMutationInput(formData))

  if (result.ok) {
    revalidatePath(ROUTES.admin.properties)
    redirect(ROUTES.admin.properties)
  }

  return toActionState(result.code, result.message, result.fieldErrors)
}

export async function archiveAdminPropertyAction(
  prevState: PropertyFormActionState = INITIAL_STATE,
  formData: FormData,
): Promise<PropertyFormActionState> {
  void prevState
  const result = await archiveAdminProperty({
    propertyId: getTextValue(formData, "propertyId"),
    reasonNote: getTextValue(formData, "reasonNote"),
  })

  if (result.ok) {
    revalidatePath(ROUTES.admin.properties)
    redirect(ROUTES.admin.properties)
  }

  return toActionState(result.code, result.message, result.fieldErrors)
}
