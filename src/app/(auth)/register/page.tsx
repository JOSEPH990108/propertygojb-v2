import { OtpRequestForm } from "@/components/auth/otp-request-form"
import { GoogleAuthCard } from "@/components/auth/google-auth-card"
import { redirectAuthenticatedUserByRole } from "@/lib/auth/guards"

export default async function RegisterPage() {
  await redirectAuthenticatedUserByRole()

  return (
    <div className="space-y-5">
      <GoogleAuthCard mode="register" />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border/80" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 tracking-[0.2em] text-muted-foreground">Or use mobile OTP</span>
        </div>
      </div>

      <OtpRequestForm purpose="REGISTER" />
    </div>
  )
}
