import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"

import { ROUTES } from "@/config/routes"
import { db, schema } from "@/db"
import { getServerSession } from "@/lib/auth/session"

function getRoleDestination(roleCode?: string | null) {
  if (roleCode === "SUPER_ADMIN" || roleCode === "ADMIN") {
    return ROUTES.admin.dashboard
  }

  if (roleCode === "AGENT") {
    return ROUTES.agent.dashboard
  }

  if (roleCode === "CUSTOMER") {
    return ROUTES.public.home
  }

  return ROUTES.auth.loginUnknownRoleError
}

async function resolveUserRoleCode(userId: string): Promise<string | null> {
  if (!db) {
    return null
  }

  const result = await db
    .select({ roleCode: schema.roles.code })
    .from(schema.user)
    .leftJoin(schema.roles, eq(schema.user.roleId, schema.roles.id))
    .where(eq(schema.user.id, userId))
    .limit(1)

  return result[0]?.roleCode ?? null
}

export default async function OAuthCallbackPage() {
  const session = await getServerSession()

  if (!session?.user?.id) {
    redirect(ROUTES.auth.login)
  }

  const roleCode = await resolveUserRoleCode(session.user.id)
  redirect(getRoleDestination(roleCode))
}