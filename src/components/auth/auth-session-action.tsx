import Link from "next/link"

import { SignOutButton } from "@/components/auth/sign-out-button"
import { ROUTES } from "@/config/routes"
import { getCurrentAuthContext } from "@/lib/auth/guards"

export async function AuthSessionAction() {
  const authContext = await getCurrentAuthContext()

  if (!authContext.isAuthenticated) {
    return (
      <Link
        href={ROUTES.auth.login}
        className="rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background"
      >
        Login
      </Link>
    )
  }

  return <SignOutButton className="h-9 rounded-md px-3 py-2 text-sm font-medium" />
}
