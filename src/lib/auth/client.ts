import { createAuthClient } from "better-auth/react"
import { phoneNumberClient } from "better-auth/client/plugins"

const baseURL = process.env.NEXT_PUBLIC_BETTER_AUTH_URL

export const authClient = createAuthClient({
  baseURL,
  basePath: "/api/auth",
  plugins: [phoneNumberClient()],
})
