import Link from "next/link"

import {
  ActionCard,
  MetricCard,
  ProButton,
  ProEmptyState,
  ProPanel,
  ProStatusBadge,
  ProTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/pro-ui"
import { ROUTES } from "@/config/routes"
import { listAdminAgents } from "@/lib/admin/agents/actions"
import { listAdminProperties } from "@/lib/admin/properties/actions"
import { listAdminUsers } from "@/lib/admin/users/actions"
import { listWorkspaceBookings } from "@/lib/internal/bookings/actions"
import { listWorkspaceDocumentRequests } from "@/lib/internal/documents/actions"
import { listWorkspaceLeads } from "@/lib/internal/leads/actions"
import { listWorkspaceWhatsappOverview } from "@/lib/internal/whatsapp/actions"

type StatusCount = {
  label: string
  count: number
}

function summarizeStatus(values: string[]): StatusCount[] {
  const counts = new Map<string, number>()

  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1)
  }

  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count
      }

      return a.label.localeCompare(b.label)
    })
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

export default async function AdminReportsPage() {
  const [
    usersResult,
    customersResult,
    propertiesResult,
    agentsAllResult,
    agentsActiveResult,
    leads,
    bookings,
    documentRequests,
    whatsappOverview,
  ] = await Promise.all([
    listAdminUsers({ role: "ALL", page: 1, pageSize: 1 }),
    listAdminUsers({ role: "CUSTOMER", page: 1, pageSize: 1 }),
    listAdminProperties({ page: 1, pageSize: 1 }),
    listAdminAgents({ state: "ALL", page: 1, pageSize: 1 }),
    listAdminAgents({ state: "ACTIVE", page: 1, pageSize: 1 }),
    listWorkspaceLeads({ nextPath: ROUTES.admin.reports, limit: 100 }),
    listWorkspaceBookings({ nextPath: ROUTES.admin.reports, limit: 100 }),
    listWorkspaceDocumentRequests({ nextPath: ROUTES.admin.reports, limit: 100 }),
    listWorkspaceWhatsappOverview({ nextPath: ROUTES.admin.reports, limit: 50 }),
  ])

  const leadsByStatus = summarizeStatus(leads.map((row) => row.status))
  const bookingsByStatus = summarizeStatus(bookings.map((row) => row.status))
  const documentsByStatus = summarizeStatus(documentRequests.map((row) => row.requestStatus))

  const activeQueueCount = whatsappOverview.queues.filter((queue) => queue.isActive).length

  return (
    <section className="internal-page">
      <ActionCard
        title="Reports"
        description={
          "Operational reporting baseline for admin decision support across user, property, lead, booking, document, and WhatsApp domains."
        }
        action={
          <div className="flex flex-wrap items-center gap-2">
            <ProButton asChild size="sm" variant="outline">
              <Link href={ROUTES.admin.leads}>Inspect Leads</Link>
            </ProButton>
            <ProButton asChild size="sm" variant="outline">
              <Link href={ROUTES.admin.bookings}>Inspect Bookings</Link>
            </ProButton>
            <ProButton asChild size="sm" variant="outline">
              <Link href={ROUTES.admin.documents}>Inspect Documents</Link>
            </ProButton>
          </div>
        }
      >
        <div className="space-y-4">
          <ProPanel className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Internal users" value={usersResult.total} hint="Current visible total" />
            <MetricCard label="Customers" value={customersResult.total} hint="Customer accounts" accent="blue" />
            <MetricCard label="Properties" value={propertiesResult.total} hint="Inventory records" accent="green" />
            <MetricCard
              label="Agents (active / total)"
              value={`${agentsActiveResult.total} / ${agentsAllResult.total}`}
              hint="Workforce availability"
              accent="amber"
            />
          </ProPanel>

          <div className="grid gap-3 md:grid-cols-3">
            <MetricCard label="Open WhatsApp conversations" value={whatsappOverview.openConversations.length} hint="Latest open queue" />
            <MetricCard label="Active WhatsApp queues" value={activeQueueCount} hint="Enabled queue lanes" accent="blue" />
            <MetricCard label="Document requests sampled" value={documentRequests.length} hint="Latest 100 records" accent="green" />
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <ProPanel className="space-y-3">
              <div>
                <h3 className="text-base font-semibold text-foreground">Lead status snapshot</h3>
                <p className="text-sm text-muted-foreground">Latest 100 leads</p>
              </div>
              {leadsByStatus.length === 0 ? (
                <ProEmptyState title="No lead records" description="No lead records found." />
              ) : (
                <ProTable>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leadsByStatus.map((row) => (
                      <TableRow key={row.label}>
                        <TableCell>
                          <ProStatusBadge label={row.label} status="pending" />
                        </TableCell>
                        <TableCell>{row.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </ProTable>
              )}
            </ProPanel>

            <ProPanel className="space-y-3">
              <div>
                <h3 className="text-base font-semibold text-foreground">Booking status snapshot</h3>
                <p className="text-sm text-muted-foreground">Latest 100 bookings</p>
              </div>
              {bookingsByStatus.length === 0 ? (
                <ProEmptyState title="No booking records" description="No booking records found." />
              ) : (
                <ProTable>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookingsByStatus.map((row) => (
                      <TableRow key={row.label}>
                        <TableCell>
                          <ProStatusBadge label={row.label} status="pending" />
                        </TableCell>
                        <TableCell>{row.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </ProTable>
              )}
            </ProPanel>

            <ProPanel className="space-y-3">
              <div>
                <h3 className="text-base font-semibold text-foreground">Document request snapshot</h3>
                <p className="text-sm text-muted-foreground">Latest 100 document requests</p>
              </div>
              {documentsByStatus.length === 0 ? (
                <ProEmptyState title="No document requests" description="No document request records found." />
              ) : (
                <ProTable>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documentsByStatus.map((row) => (
                      <TableRow key={row.label}>
                        <TableCell>
                          <ProStatusBadge label={row.label} status="pending" />
                        </TableCell>
                        <TableCell>{row.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </ProTable>
              )}
            </ProPanel>
          </div>

          <ProPanel className="space-y-3">
            <div>
              <h3 className="text-base font-semibold text-foreground">Open WhatsApp conversations</h3>
              <p className="text-sm text-muted-foreground">Latest open conversations (up to 50)</p>
            </div>
            {whatsappOverview.openConversations.length === 0 ? (
              <ProEmptyState title="No open conversations" description="No open conversations found." />
            ) : (
              <ProTable>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Queue</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Last Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {whatsappOverview.openConversations.map((conversation) => (
                    <TableRow key={conversation.id}>
                      <TableCell>
                        {conversation.customerDisplayName ?? conversation.customerPhoneE164}
                      </TableCell>
                      <TableCell>{conversation.queueName ?? "-"}</TableCell>
                      <TableCell>{conversation.ownerName ?? "Unassigned"}</TableCell>
                      <TableCell>{formatDateTime(conversation.lastMessageAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </ProTable>
            )}
          </ProPanel>

          <div className="text-xs text-muted-foreground">
            Status snapshots are computed from latest 100 records per domain for fast operational checks.
          </div>
        </div>
      </ActionCard>
    </section>
  )
}
