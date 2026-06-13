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
import {
  listAgentAppointments,
  type AgentAppointmentScope,
} from "@/lib/agent/appointments/actions"
import { setAgentAppointmentStatusFormAction } from "@/lib/agent/appointments/server-actions"

type AgentAppointmentsPageProps = {
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

function normalizeScope(value: string): AgentAppointmentScope {
  const normalized = value.trim().toUpperCase()

  if (normalized === "SCHEDULED") {
    return "SCHEDULED"
  }

  if (normalized === "PIPELINE") {
    return "PIPELINE"
  }

  return "ALL"
}

function buildQuery(params: { search: string; scope: AgentAppointmentScope; page: number }): string {
  const query = new URLSearchParams()

  if (params.search) {
    query.set("q", params.search)
  }

  if (params.scope !== "ALL") {
    query.set("scope", params.scope)
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

export default async function AgentAppointmentsPage({ searchParams }: AgentAppointmentsPageProps) {
  const params = (await searchParams) ?? {}
  const search = getQueryValue(params.q).trim()
  const scope = normalizeScope(getQueryValue(params.scope))
  const page = parsePage(getQueryValue(params.page))

  const result = await listAgentAppointments({
    search,
    scope,
    page,
    pageSize: 20,
    nextPath: ROUTES.agent.appointments,
  })

  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize))
  const previousPage = Math.max(1, result.page - 1)
  const nextPage = Math.min(totalPages, result.page + 1)

  const previousHref = `${ROUTES.agent.appointments}?${buildQuery({
    search: result.search,
    scope: result.scope,
    page: previousPage,
  })}`

  const nextHref = `${ROUTES.agent.appointments}?${buildQuery({
    search: result.search,
    scope: result.scope,
    page: nextPage,
  })}`

  return (
    <section className="internal-page">
      <Card>
        <CardHeader>
          <CardTitle>Appointments</CardTitle>
          <CardDescription>
            Your appointment queue derived from assigned qualified and nurturing leads.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="internal-metric-tile">
              <div className="text-xs text-muted-foreground">Scheduled</div>
              <div className="text-xl font-semibold">{result.scheduledCount}</div>
            </div>
            <div className="internal-metric-tile">
              <div className="text-xs text-muted-foreground">Pipeline (qualified/nurturing)</div>
              <div className="text-xl font-semibold">{result.pipelineCount}</div>
            </div>
            <div className="internal-metric-tile">
              <div className="text-xs text-muted-foreground">Visible in current scope</div>
              <div className="text-xl font-semibold">{result.total}</div>
            </div>
          </div>

          <form action={ROUTES.agent.appointments} className="grid gap-3 md:grid-cols-[2fr_1fr_auto_auto]">
            <Input
              name="q"
              defaultValue={result.search}
              placeholder="Search by lead name or phone"
            />
            <select
              name="scope"
              defaultValue={result.scope}
              className="internal-form-select"
            >
              <option value="ALL">All scopes</option>
              <option value="SCHEDULED">Scheduled only</option>
              <option value="PIPELINE">Pipeline only</option>
            </select>
            <Button type="submit" variant="outline">
              Apply
            </Button>
            <Button asChild variant="ghost">
              <Link href={ROUTES.agent.appointments}>Reset</Link>
            </Button>
          </form>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>
              Showing {result.appointments.length} of {result.total} rows for the active scope.
            </span>
            <Button asChild size="sm" variant="outline">
              <Link href={ROUTES.agent.leads}>Open Leads</Link>
            </Button>
          </div>

          {result.appointments.length === 0 ? (
            <div className="internal-empty-state">
              No appointments found for the current filters.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.appointments.map((item) => (
                  <TableRow key={item.leadId}>
                    <TableCell className="font-medium">{item.leadName}</TableCell>
                    <TableCell>{item.phone}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.status}</Badge>
                    </TableCell>
                    <TableCell>{formatDateTime(item.lastActivityAt)}</TableCell>
                    <TableCell>{formatDateTime(item.updatedAt)}</TableCell>
                    <TableCell>
                      {item.status === "APPOINTMENT_SET" ? (
                        <form action={setAgentAppointmentStatusFormAction} className="inline-flex">
                          <input type="hidden" name="leadId" value={item.leadId} />
                          <input type="hidden" name="toStatus" value="NURTURING" />
                          <input type="hidden" name="nextPath" value={ROUTES.agent.appointments} />
                          <Button type="submit" size="sm" variant="outline">
                            Move to Nurturing
                          </Button>
                        </form>
                      ) : (
                        <form action={setAgentAppointmentStatusFormAction} className="inline-flex">
                          <input type="hidden" name="leadId" value={item.leadId} />
                          <input type="hidden" name="toStatus" value="APPOINTMENT_SET" />
                          <input type="hidden" name="nextPath" value={ROUTES.agent.appointments} />
                          <Button type="submit" size="sm" variant="outline">
                            Mark Scheduled
                          </Button>
                        </form>
                      )}
                    </TableCell>
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

          <div className="text-xs text-muted-foreground">
            Dedicated appointment persistence is pending. This baseline module tracks scheduling flow through lead statuses.
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
