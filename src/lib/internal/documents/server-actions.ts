"use server"

import { revalidatePath } from "next/cache"

import { ROUTES } from "@/config/routes"
import {
  updateWorkspaceDocumentRequestStatus,
  type DocumentRequestStatusValue,
} from "@/lib/internal/documents/actions"

function getTextValue(formData: FormData, key: string): string | undefined {
  const value = formData.get(key)
  return typeof value === "string" ? value : undefined
}

export async function updateWorkspaceDocumentRequestStatusAction(
  formData: FormData,
): Promise<void> {
  const requestId = getTextValue(formData, "requestId")
  const toStatus = getTextValue(formData, "toStatus") as DocumentRequestStatusValue | undefined
  const reasonCode = getTextValue(formData, "reasonCode")
  const reasonNote = getTextValue(formData, "reasonNote")
  const nextPath = getTextValue(formData, "nextPath")

  const result = await updateWorkspaceDocumentRequestStatus({
    requestId: requestId ?? "",
    toStatus: (toStatus ?? "") as DocumentRequestStatusValue,
    reasonCode,
    reasonNote,
    nextPath,
  })

  if (result.ok) {
    revalidatePath(ROUTES.admin.documents)
    revalidatePath(ROUTES.agent.documents)
    revalidatePath(ROUTES.admin.bookings)
    revalidatePath(ROUTES.agent.bookings)
  }
}
