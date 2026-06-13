import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ROUTES } from "@/config/routes"
import { listAgentCustomers } from "@/lib/agent/customers/actions"

type AgentCustomersPageProps = {
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

function buildQuery(params: { search: string; page: number }): string {
  const query = new URLSearchParams()

  if (params.search) {
    query.set("q", params.search)
  }

  query.set("page", String(params.page))

  return query.toString()
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return "-"
  }

  return new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

export default async function AgentCustomersPage({ searchParams }: AgentCustomersPageProps) {
  const params = (await searchParams) ?? {}
  const search = getQueryValue(params.q).trim()
  const page = parsePage(getQueryValue(params.page))

  const result = await listAgentCustomers({
    search,
    page,
    pageSize: 20,
    nextPath: ROUTES.agent.customers,
  })

  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize))
  const previousPage = Math.max(1, result.page - 1)
  const nextPage = Math.min(totalPages, result.page + 1)

  const previousHref = `${ROUTES.agent.customers}?${buildQuery({
    search: result.search,
    page: previousPage,
  })}`

  const nextHref = `${ROUTES.agent.customers}?${buildQuery({
    search: result.search,
    page: nextPage,
  })}`

  return (
    <section className="internal-page">
      <Card>
        <CardHeader>
          <CardTitle>Customers</CardTitle>
          <CardDescription>
            Assigned customer portfolio with lead status and booking context for your queue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={ROUTES.agent.customers} className="grid gap-3 md:grid-cols-[2fr_auto_auto]">
            <Input
              name="q"
              defaultValue={result.search}
              placeholder="Search by customer name, phone, or email"
            />
            <Button type="submit" variant="outline">
              Apply
            </Button>
            <Button asChild variant="ghost">
              <Link href={ROUTES.agent.customers}>Reset</Link>
            </Button>
          </form>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>
              Showing {result.customers.length} of {result.total} assigned customers.
            </span>
            <Button asChild size="sm" variant="outline">
              <Link href={ROUTES.agent.leads}>Open Leads Workspace</Link>
            </Button>
          </div>

          {result.customers.length === 0 ? (
            <div className="internal-empty-state">
              No assigned customers found for the current filters.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Active Bookings</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.customers.map((customer) => (
                  <TableRow key={customer.leadId}>
                    <TableCell className="font-medium">{customer.fullName}</TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell>{customer.email ?? "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{customer.status}</Badge>
                    </TableCell>
                    <TableCell>{customer.activeBookingCount}</TableCell>
                    <TableCell>{formatDateTime(customer.lastActivityAt)}</TableCell>
                    <TableCell>{formatDateTime(customer.updatedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

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
