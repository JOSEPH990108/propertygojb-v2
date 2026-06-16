"use server"

import { revalidatePath } from "next/cache"

import {
  assignInternalUserRole,
  type AssignInternalUserRoleInput,
  type AssignInternalUserRoleResult,
} from "@/lib/admin/users/actions"
import { ROUTES } from "@/config/routes"

export async function assignInternalUserRoleAction(
  input: AssignInternalUserRoleInput,
): Promise<AssignInternalUserRoleResult> {
  const result = await assignInternalUserRole(input)

  if (result.ok) {
    revalidatePath(ROUTES.admin.users)
  }

  return result
}
