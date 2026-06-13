"use server"

import { revalidatePath } from "next/cache"

import { ROUTES } from "@/config/routes"
import {
  createAdminAgent,
  setAdminAgentActiveState,
  updateAdminAgent,
  type AdminAgentMutationInput,
  type AdminAgentMutationResult,
  type SetAdminAgentActiveStateInput,
} from "@/lib/admin/agents/actions"

function getTextValue(formData: FormData, key: string): string | undefined {
  const value = formData.get(key)
  return typeof value === "string" ? value : undefined
}

export async function createAdminAgentAction(
  input: AdminAgentMutationInput,
): Promise<AdminAgentMutationResult> {
  const result = await createAdminAgent(input)

  if (result.ok) {
    revalidatePath(ROUTES.admin.agents)
    revalidatePath(ROUTES.admin.users)
  }

  return result
}

export async function updateAdminAgentAction(
  input: AdminAgentMutationInput,
): Promise<AdminAgentMutationResult> {
  const result = await updateAdminAgent(input)

  if (result.ok) {
    revalidatePath(ROUTES.admin.agents)
    revalidatePath(ROUTES.admin.users)
  }

  return result
}

export async function setAdminAgentActiveStateAction(
  input: SetAdminAgentActiveStateInput,
): Promise<AdminAgentMutationResult> {
  const result = await setAdminAgentActiveState(input)

  if (result.ok) {
    revalidatePath(ROUTES.admin.agents)
    revalidatePath(ROUTES.admin.users)
  }

  return result
}

export async function setAdminAgentActiveStateFormAction(formData: FormData): Promise<void> {
  const agentUserId = getTextValue(formData, "agentUserId")
  const isActiveRaw = getTextValue(formData, "isActive")

  await setAdminAgentActiveStateAction({
    agentUserId,
    isActive: isActiveRaw,
  })
}
