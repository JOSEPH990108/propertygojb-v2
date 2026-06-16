import Link from "next/link"

import {
  ActionCard,
  MetricCard,
  ProButton,
  ProSearchInput,
  ProSelect,
  ProStatusBadge,
  ProTable,
  ProTableEmptyState,
  ProTableFilter,
  ProTableToolbar,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/pro-ui"
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
      <ActionCard
        title="Appointments"
        description="Appointment scheduling queue baseline built from current lead pipeline statuses."
      >
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard label="Appointment Set" value={scheduledCount} hint="Confirmed scheduled leads" />
            <MetricCard label="Pipeline" value={pipelineCount} hint="Qualified and nurturing" accent="blue" />
            <MetricCard label="Unassigned" value={unassignedCount} hint="Needs assignment" accent="amber" />
          </div>

          <form action={ROUTES.admin.appointments}>
            <ProTableToolbar className="grid gap-3 md:grid-cols-[2fr_1fr_auto_auto]">
              <ProSearchInput
                name="q"
                defaultValue={search}
                placeholder="Search by lead name, phone, status, or assignee"
              />
              <ProTableFilter as="div" className="min-h-11 p-0" showIcon={false}>
                <ProSelect
                  name="scope"
                  defaultValue={scope}
                  options={[
                    { value: "ALL", label: "All scopes" },
                    { value: "SCHEDULED", label: "Appointment set" },
                    { value: "PIPELINE", label: "Qualified / Nurturing" },
                  ]}
                />
              </ProTableFilter>
              <ProButton type="submit" variant="outline">
                Apply
              </ProButton>
              <ProButton asChild variant="ghost">
                <Link href={ROUTES.admin.appointments}>Reset</Link>
              </ProButton>
            </ProTableToolbar>
          </form>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>
              Showing {filteredLeads.length} of {leads.length} recent leads (up to latest 100 rows).
            </span>
            <div className="flex items-center gap-2">
              <ProButton asChild size="sm" variant="outline">
                <Link href={ROUTES.admin.leads}>Open Leads</Link>
              </ProButton>
              <ProButton asChild size="sm" variant="outline">
                <Link href={ROUTES.admin.bookings}>Open Bookings</Link>
              </ProButton>
            </div>
          </div>

          {filteredLeads.length === 0 ? (
            <ProTableEmptyState title="No matching leads" description="No leads match the current appointment filters." />
          ) : (
            <ProTable>
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
                      <ProStatusBadge label={lead.status} status="pending" />
                    </TableCell>
                    <TableCell>{lead.assigneeName ?? "Unassigned"}</TableCell>
                    <TableCell>{formatDateTime(lead.lastActivityAt)}</TableCell>
                    <TableCell>{formatDateTime(lead.updatedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </ProTable>
          )}

          <div className="text-xs text-muted-foreground">
            Appointment persistence model is not yet separated into a dedicated table. This baseline screen
            derives scheduling workload from lead status progression.
          </div>
        </div>
      </ActionCard>
    </section>
  )
}
