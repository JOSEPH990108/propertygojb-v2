import "server-only"

import { headers } from "next/headers"

import { auth } from "@/lib/auth/server"

export async function getServerSession() {
  const requestHeaders = await headers()

  return auth.api.getSession({
    headers: requestHeaders,
  })
}

export async function getSessionFromRequest(request: Request) {
  return auth.api.getSession({
    headers: request.headers,
  })
}
