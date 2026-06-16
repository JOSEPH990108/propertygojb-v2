"use server"

import { revalidatePath } from "next/cache"

import { ROUTES } from "@/config/routes"
import {
  updateAgentAvailability,
  updateAgentProfileBasics,
  type UpdateAgentAvailabilityResult,
  type UpdateAgentProfileBasicsInput,
  type UpdateAgentProfileBasicsResult,
} from "@/lib/agent/profile/actions"

function getTextValue(formData: FormData, key: string): string | undefined {
  const value = formData.get(key)
  return typeof value === "string" ? value : undefined
}

function revalidateProfilePaths(): void {
  revalidatePath(ROUTES.agent.profile)
  revalidatePath(ROUTES.agent.dashboard)
}

export async function updateAgentProfileBasicsAction(
  input: UpdateAgentProfileBasicsInput,
): Promise<UpdateAgentProfileBasicsResult> {
  const result = await updateAgentProfileBasics(input)

  if (result.ok) {
    revalidateProfilePaths()
  }

  return result
}

export async function updateAgentProfileBasicsFormAction(formData: FormData): Promise<void> {
  const nextPath = getTextValue(formData, "nextPath")

  await updateAgentProfileBasicsAction({
    name: getTextValue(formData, "name"),
    phoneNumber: getTextValue(formData, "phoneNumber") ?? null,
    nationality: getTextValue(formData, "nationality") ?? null,
    renNumber: getTextValue(formData, "renNumber") ?? null,
    agencyName: getTextValue(formData, "agencyName") ?? null,
    nextPath,
  })
}

export async function updateAgentAvailabilityFormAction(
  formData: FormData,
): Promise<UpdateAgentAvailabilityResult> {
  const nextPath = getTextValue(formData, "nextPath")
  const isAvailableRaw = getTextValue(formData, "isAvailable")
  const note = getTextValue(formData, "note")

  return updateAgentAvailability({
    isAvailable: isAvailableRaw,
    note,
    nextPath,
  })
}