import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
      <Card>
        <CardHeader>
          <CardTitle>Reports</CardTitle>
          <CardDescription>
            Operational reporting baseline for admin decision support across user, property, lead, booking,
            document, and WhatsApp domains.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="internal-metric-tile">
              <div className="text-xs text-muted-foreground">Internal users</div>
              <div className="text-xl font-semibold">{usersResult.total}</div>
            </div>
            <div className="internal-metric-tile">
              <div className="text-xs text-muted-foreground">Customers</div>
              <div className="text-xl font-semibold">{customersResult.total}</div>
            </div>
            <div className="internal-metric-tile">
              <div className="text-xs text-muted-foreground">Properties</div>
              <div className="text-xl font-semibold">{propertiesResult.total}</div>
            </div>
            <div className="internal-metric-tile">
              <div className="text-xs text-muted-foreground">Agents (active / total)</div>
              <div className="text-xl font-semibold">
                {agentsActiveResult.total} / {agentsAllResult.total}
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="internal-metric-tile">
              <div className="text-xs text-muted-foreground">Open WhatsApp conversations</div>
              <div className="text-xl font-semibold">{whatsappOverview.openConversations.length}</div>
            </div>
            <div className="internal-metric-tile">
              <div className="text-xs text-muted-foreground">Active WhatsApp queues</div>
              <div className="text-xl font-semibold">{activeQueueCount}</div>
            </div>
            <div className="internal-metric-tile">
              <div className="text-xs text-muted-foreground">Document requests sampled</div>
              <div className="text-xl font-semibold">{documentRequests.length}</div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Lead status snapshot</CardTitle>
                <CardDescription>Latest 100 leads</CardDescription>
              </CardHeader>
              <CardContent>
                {leadsByStatus.length === 0 ? (
                  <div className="internal-empty-state p-4">
                    No lead records found.
                  </div>
                ) : (
                  <Table>
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
                            <Badge variant="outline">{row.label}</Badge>
                          </TableCell>
                          <TableCell>{row.count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Booking status snapshot</CardTitle>
                <CardDescription>Latest 100 bookings</CardDescription>
              </CardHeader>
              <CardContent>
                {bookingsByStatus.length === 0 ? (
                  <div className="internal-empty-state p-4">
                    No booking records found.
                  </div>
                ) : (
                  <Table>
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
                            <Badge variant="outline">{row.label}</Badge>
                          </TableCell>
                          <TableCell>{row.count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Document request snapshot</CardTitle>
                <CardDescription>Latest 100 document requests</CardDescription>
              </CardHeader>
              <CardContent>
                {documentsByStatus.length === 0 ? (
                  <div className="internal-empty-state p-4">
                    No document request records found.
                  </div>
                ) : (
                  <Table>
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
                            <Badge variant="outline">{row.label}</Badge>
                          </TableCell>
                          <TableCell>{row.count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Open WhatsApp conversations</CardTitle>
              <CardDescription>Latest open conversations (up to 50)</CardDescription>
            </CardHeader>
            <CardContent>
              {whatsappOverview.openConversations.length === 0 ? (
                <div className="internal-empty-state p-4">
                  No open conversations found.
                </div>
              ) : (
                <Table>
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
                </Table>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>Status snapshots are computed from latest 100 records per domain for fast operational checks.</span>
            <Button asChild size="sm" variant="outline">
              <Link href={ROUTES.admin.leads}>Inspect Leads</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={ROUTES.admin.bookings}>Inspect Bookings</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={ROUTES.admin.documents}>Inspect Documents</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
