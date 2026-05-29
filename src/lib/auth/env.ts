import "server-only"

const AUTH_BASE_PATH = "/api/auth"

type AuthRuntimeEnv = {
  appEnv: string
  authBasePath: string
  baseURL?: string
  databaseUrl: string
  secret: string
}

type GoogleOAuthEnv = {
  clientId?: string
  clientSecret?: string
  isConfigured: boolean
  isPartiallyConfigured: boolean
}

function readAppEnv(): string {
  return process.env.APP_ENV ?? process.env.NODE_ENV ?? "development"
}

function isProductionLike(appEnv: string): boolean {
  return appEnv.toLowerCase() === "production"
}

function resolveAuthBaseURL(): string | undefined {
  return process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_BETTER_AUTH_URL
}

export function getAuthRuntimeEnv(): AuthRuntimeEnv {
  const appEnv = readAppEnv()

  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is missing. Auth runtime cannot start.")
  }

  const secret = process.env.BETTER_AUTH_SECRET ?? process.env.AUTH_SECRET
  if (!secret) {
    throw new Error(
      "BETTER_AUTH_SECRET (or AUTH_SECRET) is missing. Auth runtime cannot start.",
    )
  }

  const baseURL = resolveAuthBaseURL()
  if (isProductionLike(appEnv) && !baseURL) {
    throw new Error(
      "BETTER_AUTH_URL (or NEXT_PUBLIC_BETTER_AUTH_URL) is required in production.",
    )
  }

  return {
    appEnv,
    authBasePath: AUTH_BASE_PATH,
    baseURL,
    databaseUrl,
    secret,
  }
}

export function getGoogleOAuthEnvAssumptions(): GoogleOAuthEnv {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const isConfigured = Boolean(clientId && clientSecret)
  const isPartiallyConfigured = Boolean(clientId || clientSecret) && !isConfigured

  return {
    clientId,
    clientSecret,
    isConfigured,
    isPartiallyConfigured,
  }
}

export function assertGoogleOAuthEnvConfigured(): { clientId: string; clientSecret: string } {
  const env = getGoogleOAuthEnvAssumptions()

  if (!env.isConfigured) {
    throw new Error(
      "Google OAuth env is not fully configured. Both GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required.",
    )
  }

  return {
    clientId: env.clientId!,
    clientSecret: env.clientSecret!,
  }
}
