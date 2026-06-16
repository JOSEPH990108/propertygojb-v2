"use server"

import { revalidatePath } from "next/cache"

import { ROUTES } from "@/config/routes"
import {
  submitPublicInquiry,
  type PublicInquiryFieldErrors,
  type SubmitPublicInquiryResult,
} from "@/lib/public/inquiries/actions"

export type PublicInquiryFormActionState = {
  status: "idle" | "success" | "error"
  message?: string
  fieldErrors: PublicInquiryFieldErrors
}

function getTextValue(formData: FormData, key: string): string | undefined {
  const value = formData.get(key)
  return typeof value === "string" ? value : undefined
}

function mapResultToFormState(result: SubmitPublicInquiryResult): PublicInquiryFormActionState {
  if (result.ok) {
    return {
      status: "success",
      message: result.message,
      fieldErrors: {},
    }
  }

  return {
    status: "error",
    message: result.message,
    fieldErrors: result.fieldErrors ?? {},
  }
}

function revalidatePublicFunnelPaths(): void {
  revalidatePath(ROUTES.public.home)
  revalidatePath(ROUTES.public.projects)
  revalidatePath(ROUTES.public.contact)
  revalidatePath(ROUTES.public.bookViewing)
}

export async function submitPublicContactFormAction(
  _prevState: PublicInquiryFormActionState,
  formData: FormData,
): Promise<PublicInquiryFormActionState> {
  const result = await submitPublicInquiry({
    inquiryType: "CONTACT",
    fullName: getTextValue(formData, "fullName"),
    phoneNumber: getTextValue(formData, "phoneNumber"),
    email: getTextValue(formData, "email"),
    message: getTextValue(formData, "message"),
    projectId: getTextValue(formData, "projectId"),
    preferredLanguage: getTextValue(formData, "preferredLanguage"),
    preferredContactChannel: getTextValue(formData, "preferredContactChannel"),
    nextPath: getTextValue(formData, "nextPath"),
  })

  if (result.ok) {
    revalidatePublicFunnelPaths()
  }

  return mapResultToFormState(result)
}

export async function submitPublicBookViewingFormAction(
  _prevState: PublicInquiryFormActionState,
  formData: FormData,
): Promise<PublicInquiryFormActionState> {
  const result = await submitPublicInquiry({
    inquiryType: "BOOK_VIEWING",
    fullName: getTextValue(formData, "fullName"),
    phoneNumber: getTextValue(formData, "phoneNumber"),
    email: getTextValue(formData, "email"),
    message: getTextValue(formData, "message"),
    projectId: getTextValue(formData, "projectId"),
    preferredLanguage: getTextValue(formData, "preferredLanguage"),
    preferredContactChannel: getTextValue(formData, "preferredContactChannel"),
    preferredVisitDate: getTextValue(formData, "preferredVisitDate"),
    preferredVisitTime: getTextValue(formData, "preferredVisitTime"),
    partySize: getTextValue(formData, "partySize"),
    nextPath: getTextValue(formData, "nextPath"),
  })

  if (result.ok) {
    revalidatePublicFunnelPaths()
  }

  return mapResultToFormState(result)
}
