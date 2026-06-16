import Link from "next/link"

import { AdminAgentsTable } from "@/components/admin/agents/admin-agents-table"
import { ActionCard, ProButton, ProSearchInput, ProSelect, ProTableFilter, ProTablePagination, ProTableToolbar } from "@/components/pro-ui"
import { ROUTES } from "@/config/routes"
import { listAdminAgents } from "@/lib/admin/agents/actions"

type AgentsPageProps = {
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

function buildAgentsQuery(params: {
  search: string
  state: "ALL" | "ACTIVE" | "INACTIVE"
  page: number
}): string {
  const query = new URLSearchParams()

  if (params.search) {
    query.set("q", params.search)
  }

  if (params.state !== "ALL") {
    query.set("state", params.state)
  }

  query.set("page", String(params.page))

  return query.toString()
}

export default async function AdminAgentsPage({ searchParams }: AgentsPageProps) {
  const params = (await searchParams) ?? {}
  const search = getQueryValue(params.q).trim()
  const state = getQueryValue(params.state).trim().toUpperCase()
  const page = parsePage(getQueryValue(params.page))

  const result = await listAdminAgents({
    search,
    state,
    page,
    pageSize: 20,
  })

  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize))
  const previousPage = Math.max(1, result.page - 1)
  const nextPage = Math.min(totalPages, result.page + 1)

  const previousHref = `${ROUTES.admin.agents}?${buildAgentsQuery({
    search: result.search,
    state: result.state,
    page: previousPage,
  })}`

  const nextHref = `${ROUTES.admin.agents}?${buildAgentsQuery({
    search: result.search,
    state: result.state,
    page: nextPage,
  })}`

  return (
    <section className="internal-page">
      <ActionCard title="Agents" description="Agent directory with active-state control and registration profile visibility.">
        <div className="space-y-4">
          <form action={ROUTES.admin.agents}>
            <ProTableToolbar className="grid gap-3 md:grid-cols-[2fr_1fr_auto_auto]">
              <ProSearchInput
                name="q"
                defaultValue={result.search}
                placeholder="Search by name, email, phone, agency, or REN"
              />
              <ProTableFilter as="div" className="min-h-11 p-0" showIcon={false}>
                <ProSelect
                  name="state"
                  defaultValue={result.state}
                  options={[
                    { value: "ALL", label: "All states" },
                    { value: "ACTIVE", label: "Active" },
                    { value: "INACTIVE", label: "Inactive" },
                  ]}
                />
              </ProTableFilter>
              <ProButton type="submit" variant="outline">
                Apply
              </ProButton>
              <ProButton asChild variant="ghost">
                <Link href={ROUTES.admin.agents}>Reset</Link>
              </ProButton>
            </ProTableToolbar>
          </form>

          <div className="text-xs text-muted-foreground">
            Showing {result.agents.length} of {result.total} agents.
          </div>

          <AdminAgentsTable agents={result.agents} />

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
