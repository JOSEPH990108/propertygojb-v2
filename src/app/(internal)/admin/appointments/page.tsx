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
import { listWorkspaceLeads, type WorkspaceLeadItem } from "@/lib/internal/leads/actions"

type AppointmentsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

type AppointmentScope = "ALL" | "SCHEDULED" | "PIPELINE"

function getQueryValue(value: string | string[] | undefined): string {
  if (typeof value === "string") {
    return value
  }

  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0]
  }

  return ""
}

function normalizeScope(value: string): AppointmentScope {
  const normalized = value.trim().toUpperCase()
  switch (normalized) {
    case "SCHEDULED":
      return "SCHEDULED"
    case "PIPELINE":
      return "PIPELINE"
    default:
      return "ALL"
  }
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

function matchesSearch(lead: WorkspaceLeadItem, search: string): boolean {
  if (!search) {
    return true
  }

  const normalizedSearch = search.toLowerCase()
  return (
    lead.fullName.toLowerCase().includes(normalizedSearch) ||
    lead.phone.toLowerCase().includes(normalizedSearch) ||
    lead.status.toLowerCase().includes(normalizedSearch) ||
    (lead.assigneeName ?? "").toLowerCase().includes(normalizedSearch)
  )
}

function matchesScope(lead: WorkspaceLeadItem, scope: AppointmentScope): boolean {
  if (scope === "ALL") {
    return true
  }

  if (scope === "SCHEDULED") {
    return lead.status === "APPOINTMENT_SET"
  }

  return lead.status === "QUALIFIED" || lead.status === "NURTURING"
}

export default async function AdminAppointmentsPage({ searchParams }: AppointmentsPageProps) {
  const params = (await searchParams) ?? {}
  const search = getQueryValue(params.q).trim()
  const scope = normalizeScope(getQueryValue(params.scope))

  const leads = await listWorkspaceLeads({
    nextPath: ROUTES.admin.appointments,
    limit: 100,
  })

  const scheduledCount = leads.filter((lead) => lead.status === "APPOINTMENT_SET").length
  const pipelineCount = leads.filter(
    (lead) => lead.status === "QUALIFIED" || lead.status === "NURTURING",
  ).length
  const unassignedCount = leads.filter((lead) => !lead.assigneeName).length

  const filteredLeads = leads.filter((lead) => matchesSearch(lead, search) && matchesScope(lead, scope))

  return (
    <section className="internal-page">
      <Card>
        <CardHeader>
          <CardTitle>Appointments</CardTitle>
          <CardDescription>
            Appointment scheduling queue baseline built from current lead pipeline statuses.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="internal-metric-tile">
              <div className="text-xs text-muted-foreground">Appointment set</div>
              <div className="text-xl font-semibold">{scheduledCount}</div>
            </div>
            <div className="internal-metric-tile">
              <div className="text-xs text-muted-foreground">Pipeline (qualified/nurturing)</div>
              <div className="text-xl font-semibold">{pipelineCount}</div>
            </div>
            <div className="internal-metric-tile">
              <div className="text-xs text-muted-foreground">Unassigned leads</div>
              <div className="text-xl font-semibold">{unassignedCount}</div>
            </div>
          </div>

          <form action={ROUTES.admin.appointments} className="grid gap-3 md:grid-cols-[2fr_1fr_auto_auto]">
            <Input
              name="q"
              defaultValue={search}
              placeholder="Search by lead name, phone, status, or assignee"
            />
            <select
              name="scope"
              defaultValue={scope}
              className="internal-form-select"
            >
              <option value="ALL">All scopes</option>
              <option value="SCHEDULED">Appointment set</option>
              <option value="PIPELINE">Qualified / Nurturing</option>
            </select>
            <Button type="submit" variant="outline">
              Apply
            </Button>
            <Button asChild variant="ghost">
              <Link href={ROUTES.admin.appointments}>Reset</Link>
            </Button>
          </form>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>
              Showing {filteredLeads.length} of {leads.length} recent leads (up to latest 100 rows).
            </span>
            <div className="flex items-center gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href={ROUTES.admin.leads}>Open Leads</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href={ROUTES.admin.bookings}>Open Bookings</Link>
              </Button>
            </div>
          </div>

          {filteredLeads.length === 0 ? (
            <div className="internal-empty-state">
              No leads match the current appointment filters.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.fullName}</TableCell>
                    <TableCell>{lead.phone}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{lead.status}</Badge>
                    </TableCell>
                    <TableCell>{lead.assigneeName ?? "Unassigned"}</TableCell>
                    <TableCell>{formatDateTime(lead.lastActivityAt)}</TableCell>
                    <TableCell>{formatDateTime(lead.updatedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <div className="text-xs text-muted-foreground">
            Appointment persistence model is not yet separated into a dedicated table. This baseline screen
            derives scheduling workload from lead status progression.
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
