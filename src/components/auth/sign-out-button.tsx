"use client"

import { LoaderCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { ROUTES } from "@/config/routes"
import { signOutClient } from "@/lib/auth/sign-out-client"

type SignOutButtonProps = {
  className?: string
}

export function SignOutButton({ className }: SignOutButtonProps) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const onSignOut = async () => {
    if (isPending) {
      return
    }

    setErrorMessage(null)
    setIsPending(true)

    const result = await signOutClient()

    if (!result.ok) {
      setIsPending(false)
      setErrorMessage("Unable to sign out. Please try again.")
      return
    }

    router.replace(ROUTES.auth.login)
    router.refresh()
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        className={className}
        onClick={onSignOut}
        disabled={isPending}
      >
        {isPending ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        ) : null}
        <span>{isPending ? "Signing out..." : "Sign out"}</span>
      </Button>

      {errorMessage ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errorMessage}
        </p>
      ) : null}
    </div>
  )
}
