import "server-only"

import { drizzleAdapter } from "@better-auth/drizzle-adapter"
import { betterAuth } from "better-auth"
import { nextCookies } from "better-auth/next-js"

import { db, schema } from "@/db"
import { getAuthRuntimeEnv } from "@/lib/auth/env"

const env = getAuthRuntimeEnv()

if (!db) {
  throw new Error("Database client is not available. Auth runtime cannot start.")
}

const authSchema = {
  user: schema.user,
  session: schema.session,
  account: schema.account,
  verification: schema.verification,
}

export const auth = betterAuth({
  appName: "PropertyGo JB",
  basePath: env.authBasePath,
  baseURL: env.baseURL,
  secret: env.secret,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: authSchema,
  }),
  emailAndPassword: {
    enabled: false,
  },
  plugins: [nextCookies()],
})
