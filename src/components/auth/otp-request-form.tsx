"use client"

import { LoaderCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { PhoneNumberInput } from "@/components/auth/phone-number-input"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/config/routes"
import { requestOtpCodeClient } from "@/lib/auth/otp/client"
import { normalizePhoneToE164 } from "@/lib/auth/otp/phone"
import type { OtpPurpose } from "@/lib/auth/otp/types"

type OtpRequestFormProps = {
  purpose: OtpPurpose
}

const REQUEST_FAILURE_MESSAGE = "Unable to send code. Please try again later."

export function OtpRequestForm({ purpose }: OtpRequestFormProps) {
  const router = useRouter()
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(null)

    const normalizedInput = phoneNumber.trim()
    if (!normalizedInput) {
      setErrorMessage("Phone number is required.")
      return
    }

    const normalizedPhone = normalizePhoneToE164(normalizedInput)
    if (!normalizedPhone.ok) {
      setErrorMessage("Phone number is required.")
      return
    }

    setIsLoading(true)

    const response = await requestOtpCodeClient({
      phoneNumber: normalizedPhone.data.phoneE164,
      purpose,
    })

    setIsLoading(false)

    if (!response.ok) {
      setErrorMessage(REQUEST_FAILURE_MESSAGE)
      return
    }

    const verifyUrl = new URL(ROUTES.auth.verifyOtp, window.location.origin)
    verifyUrl.searchParams.set("phoneNumber", normalizedPhone.data.phoneE164)
    verifyUrl.searchParams.set("requestId", response.requestId)
    verifyUrl.searchParams.set("purpose", purpose)

    router.push(`${verifyUrl.pathname}${verifyUrl.search}`)
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor={`phone-${purpose.toLowerCase()}`}>
          Mobile number
        </label>
        <PhoneNumberInput
          id={`phone-${purpose.toLowerCase()}`}
          value={phoneNumber}
          onValueChange={setPhoneNumber}
          disabled={isLoading}
          ariaInvalid={errorMessage ? true : undefined}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        ) : null}
        <span>{purpose === "LOGIN" ? "Send login code" : "Send registration code"}</span>
      </Button>

      {errorMessage ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errorMessage}
        </p>
      ) : null}
    </form>
  )
}