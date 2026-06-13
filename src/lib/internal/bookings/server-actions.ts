"use server"

import { revalidatePath } from "next/cache"

import { ROUTES } from "@/config/routes"
import {
  updateWorkspaceBookingStatus,
  type BookingStatusValue,
} from "@/lib/internal/bookings/actions"

function getTextValue(formData: FormData, key: string): string | undefined {
  const value = formData.get(key)
  return typeof value === "string" ? value : undefined
}

export async function updateWorkspaceBookingStatusAction(
  formData: FormData,
): Promise<void> {
  const bookingId = getTextValue(formData, "bookingId")
  const toStatus = getTextValue(formData, "toStatus") as BookingStatusValue | undefined
  const reasonCode = getTextValue(formData, "reasonCode")
  const reasonNote = getTextValue(formData, "reasonNote")
  const nextPath = getTextValue(formData, "nextPath")

  const result = await updateWorkspaceBookingStatus({
    bookingId: bookingId ?? "",
    toStatus: (toStatus ?? "") as BookingStatusValue,
    reasonCode,
    reasonNote,
    nextPath,
  })

  if (result.ok) {
    revalidatePath(ROUTES.admin.bookings)
    revalidatePath(ROUTES.agent.bookings)
    revalidatePath(ROUTES.admin.documents)
    revalidatePath(ROUTES.agent.documents)
  }
}
