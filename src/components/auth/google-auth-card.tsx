"use client"

import Link from "next/link"
import { LoaderCircle } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { ROUTES } from "@/config/routes"
import { authClient } from "@/lib/auth/client"

type GoogleAuthCardProps = {
  mode: "login" | "register"
}

type AuthModeContent = {
  title: string
  description: string
  ctaLabel: string
  footerPrompt: string
  footerActionLabel: string
  footerActionHref: string
}

const modeContent: Record<GoogleAuthCardProps["mode"], AuthModeContent> = {
  login: {
    title: "Welcome back",
    description:
      "Use your Google account to continue. Existing internal users keep their assigned access area.",
    ctaLabel: "Continue with Google",
    footerPrompt: "Need a customer account?",
    footerActionLabel: "Register",
    footerActionHref: ROUTES.auth.register,
  },
  register: {
    title: "Create your customer account",
    description:
      "Public Google sign-up creates CUSTOMER access only. Internal roles are never auto-assigned from this flow.",
    ctaLabel: "Register with Google",
    footerPrompt: "Already have an account?",
    footerActionLabel: "Login",
    footerActionHref: ROUTES.auth.login,
  },
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" className="size-4" viewBox="0 0 18 18">
      <path
        fill="#EA4335"
        d="M9 7.36v3.53h4.91c-.22 1.13-.87 2.09-1.85 2.73l2.99 2.32c1.74-1.61 2.74-3.99 2.74-6.82 0-.64-.06-1.26-.17-1.85H9Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.48 0 4.56-.82 6.08-2.22l-2.99-2.32c-.83.56-1.9.9-3.09.9-2.37 0-4.37-1.59-5.09-3.74H.82v2.4A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#4A90E2"
        d="M3.91 10.62A5.42 5.42 0 0 1 3.62 9c0-.56.1-1.11.29-1.62v-2.4H.82A9 9 0 0 0 0 9c0 1.45.35 2.82.97 4.02l2.94-2.4Z"
      />
      <path
        fill="#FBBC05"
        d="M9 3.58c1.35 0 2.56.47 3.52 1.39l2.64-2.64A8.84 8.84 0 0 0 9 0 9 9 0 0 0 .82 4.98l3.09 2.4C4.63 5.17 6.63 3.58 9 3.58Z"
      />
    </svg>
  )
}

export function GoogleAuthCard({ mode }: GoogleAuthCardProps) {
  const [isPending, setIsPending] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const content = modeContent[mode]

  const onGoogleAuth = async () => {
    setErrorMessage(null)
    setIsPending(true)

    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: ROUTES.auth.oauthCallback,
        newUserCallbackURL: ROUTES.auth.oauthCallback,
        errorCallbackURL: ROUTES.auth.loginOauthError,
      })
    } catch (error) {
      setIsPending(false)
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Google sign-in failed. Please try again.",
      )
    }
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
          Auth
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{content.title}</h1>
        <p className="text-sm text-muted-foreground">{content.description}</p>
      </div>

      <Button
        type="button"
        variant="outline"
        className="h-10 w-full"
        onClick={onGoogleAuth}
        disabled={isPending}
      >
        {isPending ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <GoogleMark />
        )}
        <span>{content.ctaLabel}</span>
      </Button>

      {errorMessage ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errorMessage}
        </p>
      ) : null}

      <p className="text-sm text-muted-foreground">
        {content.footerPrompt}{" "}
        <Link
          className="font-medium text-foreground underline-offset-4 hover:underline"
          href={content.footerActionHref}
        >
          {content.footerActionLabel}
        </Link>
      </p>
    </div>
  )
}