"use server"

import { revalidatePath } from "next/cache"

import { ROUTES } from "@/config/routes"
import {
  rescheduleAgentAppointment,
  setAgentAppointmentStatus,
  type SetAgentAppointmentStatusInput,
} from "@/lib/agent/appointments/actions"
import { type LeadStatusValue } from "@/lib/internal/leads/actions"

function getTextValue(formData: FormData, key: string): string | undefined {
  const value = formData.get(key)
  return typeof value === "string" ? value : undefined
}

function revalidateAppointmentPaths(): void {
  revalidatePath(ROUTES.agent.appointments)
  revalidatePath(ROUTES.agent.leads)
  revalidatePath(ROUTES.admin.appointments)
  revalidatePath(ROUTES.admin.leads)
  revalidatePath(ROUTES.admin.reports)
}

export async function setAgentAppointmentStatusAction(
  input: SetAgentAppointmentStatusInput,
): Promise<void> {
  const result = await setAgentAppointmentStatus(input)
  if (result.ok) {
    revalidateAppointmentPaths()
  }
}

export async function setAgentAppointmentStatusFormAction(formData: FormData): Promise<void> {
  const leadId = getTextValue(formData, "leadId")
  const toStatus = getTextValue(formData, "toStatus") as LeadStatusValue | undefined
  const reasonCode = getTextValue(formData, "reasonCode")
  const reasonNote = getTextValue(formData, "reasonNote")
  const nextPath = getTextValue(formData, "nextPath")

  await setAgentAppointmentStatusAction({
    leadId: leadId ?? "",
    toStatus: (toStatus ?? "") as LeadStatusValue,
    reasonCode,
    reasonNote,
    nextPath,
  })
}

export async function rescheduleAgentAppointmentFormAction(formData: FormData): Promise<void> {
  const leadId = getTextValue(formData, "leadId")
  const scheduledAt = getTextValue(formData, "scheduledAt")
  const note = getTextValue(formData, "note")
  const nextPath = getTextValue(formData, "nextPath")

  const result = await rescheduleAgentAppointment({
    leadId: leadId ?? "",
    scheduledAt,
    note,
    nextPath,
  })

  if (result.ok) {
    revalidateAppointmentPaths()
  }
}