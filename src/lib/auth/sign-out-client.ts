"use client"

import { authClient } from "@/lib/auth/client"

export type SignOutClientResult = {
  ok: boolean
}

export async function signOutClient(): Promise<SignOutClientResult> {
  try {
    await authClient.signOut()
    return { ok: true }
  } catch {
    return { ok: false }
  }
}
