"use client"

import { LoaderCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { PhoneNumberInput } from "@/components/auth/phone-number-input"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { verifyOtpCodeClient } from "@/lib/auth/otp/client"
import { normalizePhoneToE164 } from "@/lib/auth/otp/phone"

const OTP_CODE_REGEX = /^\d{6}$/

type OtpVerifyFormProps = {
  initialPhoneNumber?: string
  initialRequestId?: string
}

export function OtpVerifyForm({ initialPhoneNumber, initialRequestId }: OtpVerifyFormProps) {
  const router = useRouter()

  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber ?? "")
  const [code, setCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(null)

    const normalizedPhoneInput = phoneNumber.trim()
    if (!normalizedPhoneInput) {
      setErrorMessage("Phone number is required.")
      return
    }

    const normalizedPhone = normalizePhoneToE164(normalizedPhoneInput)
    if (!normalizedPhone.ok) {
      setErrorMessage("Phone number is required.")
      return
    }

    const normalizedCode = code.trim()
    if (!OTP_CODE_REGEX.test(normalizedCode)) {
      setErrorMessage("Code must be 6 digits.")
      return
    }

    setIsLoading(true)

    const response = await verifyOtpCodeClient({
      phoneNumber: normalizedPhone.data.phoneE164,
      code: normalizedCode,
    }, initialRequestId)

    setIsLoading(false)

    if (!response.ok) {
      setErrorMessage("Invalid or expired code.")
      return
    }

    router.replace(response.redirectTo)
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="verify-phone-number">
          Mobile number
        </label>
        <PhoneNumberInput
          id="verify-phone-number"
          value={phoneNumber}
          onValueChange={setPhoneNumber}
          disabled={isLoading}
          ariaInvalid={errorMessage ? true : undefined}
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="verify-otp-code">
          6-digit code
        </label>
        <Input
          id="verify-otp-code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(event) => {
            const digits = event.target.value.replace(/\D/g, "")
            setCode(digits.slice(0, 6))
          }}
          placeholder="123456"
          disabled={isLoading}
          aria-invalid={errorMessage ? true : undefined}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : null}
        <span>Verify code</span>
      </Button>

      {errorMessage ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errorMessage}
        </p>
      ) : null}
    </form>
  )
}