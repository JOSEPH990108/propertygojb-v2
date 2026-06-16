import Link from "next/link"

import { AdminCustomersTable } from "@/components/admin/customers/admin-customers-table"
import { ActionCard, ProButton, ProSearchInput, ProTablePagination, ProTableToolbar } from "@/components/pro-ui"
import { ROUTES } from "@/config/routes"
import { listAdminUsers } from "@/lib/admin/users/actions"

type CustomersPageProps = {
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

function buildCustomersQuery(params: { search: string; page: number }): string {
  const query = new URLSearchParams()

  if (params.search) {
    query.set("q", params.search)
  }

  query.set("page", String(params.page))

  return query.toString()
}

export default async function AdminCustomersPage({ searchParams }: CustomersPageProps) {
  const params = (await searchParams) ?? {}
  const search = getQueryValue(params.q).trim()
  const page = parsePage(getQueryValue(params.page))

  const result = await listAdminUsers({
    search,
    role: "CUSTOMER",
    page,
    pageSize: 20,
  })

  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize))
  const previousPage = Math.max(1, result.page - 1)
  const nextPage = Math.min(totalPages, result.page + 1)

  const previousHref = `${ROUTES.admin.customers}?${buildCustomersQuery({
    search: result.search,
    page: previousPage,
  })}`

  const nextHref = `${ROUTES.admin.customers}?${buildCustomersQuery({
    search: result.search,
    page: nextPage,
  })}`

  return (
    <section className="internal-page">
      <ActionCard title="Customers" description="Customer account directory with core profile and contact visibility.">
        <div className="space-y-4">
          <form action={ROUTES.admin.customers}>
            <ProTableToolbar className="grid gap-3 md:grid-cols-[2fr_auto_auto]">
              <ProSearchInput
                name="q"
                defaultValue={result.search}
                placeholder="Search by customer name, email, or phone"
              />
              <ProButton type="submit" variant="outline">
                Apply
              </ProButton>
              <ProButton asChild variant="ghost">
                <Link href={ROUTES.admin.customers}>Reset</Link>
              </ProButton>
            </ProTableToolbar>
          </form>

          <div className="text-xs text-muted-foreground">
            Showing {result.users.length} of {result.total} customers.
          </div>

          <AdminCustomersTable customers={result.users} />

          <ProTablePagination
            page={result.page}
            totalPages={totalPages}
            previousHref={previousHref}
            nextHref={nextHref}
          />
        </div>
      </ActionCard>
    </section>
  )
}
