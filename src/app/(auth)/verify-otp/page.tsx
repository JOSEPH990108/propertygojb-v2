import { OtpVerifyForm } from "@/components/auth/otp-verify-form"
import { ROUTES } from "@/config/routes"
import { redirectAuthenticatedUserByRole } from "@/lib/auth/guards"

type VerifyOtpPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function resolveQueryValue(value: string | string[] | undefined): string {
  if (typeof value === "string") {
    return value
  }

  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0]
  }

  return ""
}

export default async function VerifyOtpPage({ searchParams }: VerifyOtpPageProps) {
  await redirectAuthenticatedUserByRole()

  const resolvedSearchParams = (await searchParams) ?? {}
  const initialPhoneNumber = resolveQueryValue(resolvedSearchParams.phoneNumber)
  const initialRequestId = resolveQueryValue(resolvedSearchParams.requestId)

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">Auth</p>
        <h1 className="text-2xl font-semibold tracking-tight">Verify OTP</h1>
        <p className="text-sm text-muted-foreground">
          Enter the 6-digit code sent to your mobile number to continue.
        </p>
      </div>

      <OtpVerifyForm initialPhoneNumber={initialPhoneNumber} initialRequestId={initialRequestId} />

      <p className="text-sm text-muted-foreground">
        Need another code? Return to login or register and request a new OTP.
      </p>
      <p className="text-sm">
        <a className="underline-offset-4 hover:underline" href={ROUTES.auth.login}>
          Back to login
        </a>
      </p>
    </div>
  )
}
