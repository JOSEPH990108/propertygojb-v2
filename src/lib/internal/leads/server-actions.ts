"use server"

import { revalidatePath } from "next/cache"

import { ROUTES } from "@/config/routes"
import {
  updateWorkspaceLeadStatus,
  type LeadStatusValue,
} from "@/lib/internal/leads/actions"

function getTextValue(formData: FormData, key: string): string | undefined {
  const value = formData.get(key)
  return typeof value === "string" ? value : undefined
}

export async function updateWorkspaceLeadStatusAction(formData: FormData): Promise<void> {
  const leadId = getTextValue(formData, "leadId")
  const toStatus = getTextValue(formData, "toStatus") as LeadStatusValue | undefined
  const reasonCode = getTextValue(formData, "reasonCode")
  const reasonNote = getTextValue(formData, "reasonNote")
  const nextPath = getTextValue(formData, "nextPath")

  const result = await updateWorkspaceLeadStatus({
    leadId: leadId ?? "",
    toStatus: (toStatus ?? "") as LeadStatusValue,
    reasonCode,
    reasonNote,
    nextPath,
  })

  if (result.ok) {
    revalidatePath(ROUTES.admin.leads)
    revalidatePath(ROUTES.agent.leads)
    revalidatePath(ROUTES.admin.appointments)
    revalidatePath(ROUTES.admin.reports)
  }
}
