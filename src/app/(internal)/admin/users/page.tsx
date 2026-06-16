import Link from "next/link"

import { AdminUsersTable } from "@/components/admin/users/admin-users-table"
import { ActionCard, ProButton, ProSearchInput, ProSelect, ProTableFilter, ProTablePagination, ProTableToolbar } from "@/components/pro-ui"
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
    <section className="internal-page">
      <ActionCard
        title="User Management"
        description="Internal users list for ADMIN and SUPER_ADMIN with policy-gated role change controls."
      >
        <div className="space-y-4">
          <form action={ROUTES.admin.users}>
            <ProTableToolbar className="grid gap-3 md:grid-cols-[2fr_1fr_auto_auto]">
              <ProSearchInput
                name="q"
                defaultValue={result.search}
                placeholder="Search by name, email, or phone"
              />
              <ProTableFilter as="div" className="min-h-11 p-0" showIcon={false}>
                <ProSelect
                  name="role"
                  defaultValue={result.role}
                  options={[
                    { value: "ALL", label: "All roles" },
                    { value: "CUSTOMER", label: "CUSTOMER" },
                    { value: "AGENT", label: "AGENT" },
                    { value: "ADMIN", label: "ADMIN" },
                    { value: "SUPER_ADMIN", label: "SUPER_ADMIN" },
                  ]}
                />
              </ProTableFilter>
              <ProButton type="submit" variant="outline">
                Apply
              </ProButton>
              <ProButton asChild variant="ghost">
                <Link href={ROUTES.admin.users}>Reset</Link>
              </ProButton>
            </ProTableToolbar>
          </form>

          <div className="text-xs text-muted-foreground">
            Showing {result.users.length} of {result.total} users.
          </div>

          <AdminUsersTable users={result.users} />

          <ProTablePagination
            page={result.page}
            totalPages={totalPages}
            previousHref={`${ROUTES.admin.users}?q=${encodeURIComponent(result.search)}&role=${result.role}&page=${previousPage}`}
            nextHref={`${ROUTES.admin.users}?q=${encodeURIComponent(result.search)}&role=${result.role}&page=${nextPage}`}
          />
        </div>
      </ActionCard>
    </section>
  )
}
