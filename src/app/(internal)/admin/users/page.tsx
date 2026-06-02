import Link from "next/link"

import { AdminUsersTable } from "@/components/admin/users/admin-users-table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ROUTES } from "@/config/routes"
import { listAdminUsers } from "@/lib/admin/users/actions"

type UsersPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function getQueryValue(value: string | string[] | undefined): string {
  if (typeof value === "string") {
    return value
  }

  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0]
  }

  return ""
}

function parsePage(value: string): number {
  const parsed = Number.parseInt(value, 10)
  if (Number.isNaN(parsed) || parsed < 1) {
    return 1
  }

  return parsed
}

export default async function AdminUsersPage({ searchParams }: UsersPageProps) {
  const params = (await searchParams) ?? {}
  const search = getQueryValue(params.q).trim()
  const roleFilter = getQueryValue(params.role).trim().toUpperCase()
  const page = parsePage(getQueryValue(params.page))

  const result = await listAdminUsers({
    search,
    role: roleFilter as "CUSTOMER" | "AGENT" | "ADMIN" | "SUPER_ADMIN" | "ALL",
    page,
    pageSize: 20,
  })

  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize))
  const previousPage = Math.max(1, result.page - 1)
  const nextPage = Math.min(totalPages, result.page + 1)

  return (
    <section className="mx-auto w-full max-w-6xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            Read-only internal users list for ADMIN and SUPER_ADMIN. Role mutation is intentionally not enabled in this phase.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={ROUTES.admin.users} className="grid gap-3 md:grid-cols-[2fr_1fr_auto_auto]">
            <Input
              name="q"
              defaultValue={result.search}
              placeholder="Search by name, email, or phone"
            />
            <select
              name="role"
              defaultValue={result.role}
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
            >
              <option value="ALL">All roles</option>
              <option value="CUSTOMER">CUSTOMER</option>
              <option value="AGENT">AGENT</option>
              <option value="ADMIN">ADMIN</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            </select>
            <Button type="submit" variant="outline">
              Apply
            </Button>
            <Button asChild variant="ghost">
              <Link href={ROUTES.admin.users}>Reset</Link>
            </Button>
          </form>

          <div className="text-xs text-muted-foreground">
            Showing {result.users.length} of {result.total} users.
          </div>

          <AdminUsersTable users={result.users} />

          <div className="flex items-center justify-between border-t pt-3 text-sm text-muted-foreground">
            <span>
              Page {result.page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button asChild size="sm" variant="outline" disabled={result.page <= 1}>
                <Link
                  href={`${ROUTES.admin.users}?q=${encodeURIComponent(result.search)}&role=${result.role}&page=${previousPage}`}
                >
                  Previous
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline" disabled={result.page >= totalPages}>
                <Link
                  href={`${ROUTES.admin.users}?q=${encodeURIComponent(result.search)}&role=${result.role}&page=${nextPage}`}
                >
                  Next
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
