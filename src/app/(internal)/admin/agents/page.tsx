import Link from "next/link"

import { AdminAgentsTable } from "@/components/admin/agents/admin-agents-table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
      <Card>
        <CardHeader>
          <CardTitle>Agents</CardTitle>
          <CardDescription>
            Agent directory with active-state control and registration profile visibility.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={ROUTES.admin.agents} className="grid gap-3 md:grid-cols-[2fr_1fr_auto_auto]">
            <Input
              name="q"
              defaultValue={result.search}
              placeholder="Search by name, email, phone, agency, or REN"
            />
            <select
              name="state"
              defaultValue={result.state}
              className="internal-form-select"
            >
              <option value="ALL">All states</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
            <Button type="submit" variant="outline">
              Apply
            </Button>
            <Button asChild variant="ghost">
              <Link href={ROUTES.admin.agents}>Reset</Link>
            </Button>
          </form>

          <div className="text-xs text-muted-foreground">
            Showing {result.agents.length} of {result.total} agents.
          </div>

          <AdminAgentsTable agents={result.agents} />

          <div className="internal-divider flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Page {result.page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button asChild size="sm" variant="outline" disabled={result.page <= 1}>
                <Link href={previousHref}>Previous</Link>
              </Button>
              <Button asChild size="sm" variant="outline" disabled={result.page >= totalPages}>
                <Link href={nextHref}>Next</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
