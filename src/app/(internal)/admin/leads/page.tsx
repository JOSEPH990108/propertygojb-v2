import {
  ActionCard,
  ProButton,
  ProStatusBadge,
  ProTable,
  ProTableEmptyState,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/pro-ui"
import { ROUTES } from "@/config/routes"
import {
  LEAD_STATUS_VALUES,
  listWorkspaceLeads,
  resolveRoleNextLeadStatus,
  type LeadStatusValue,
} from "@/lib/internal/leads/actions"
import { updateWorkspaceLeadStatusAction } from "@/lib/internal/leads/server-actions"
import { listWorkspaceWhatsappOverview } from "@/lib/internal/whatsapp/actions"

function formatDateTime(value: string | null): string {
  if (!value) {
    return "-"
  }

  return new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

export default async function AdminLeadsPage() {
  const [leadRows, whatsapp] = await Promise.all([
    listWorkspaceLeads({
      nextPath: ROUTES.admin.leads,
      limit: 50,
    }),
    listWorkspaceWhatsappOverview({
      nextPath: ROUTES.admin.leads,
      limit: 15,
    }),
  ])

  return (
    <section className="internal-page">
      <ActionCard
        title="Leads"
        description="Operational lead queue with source/assignment visibility and workflow-safe status controls."
      >
        <div>
          {leadRows.length === 0 ? (
            <ProTableEmptyState title="No leads available" description="No leads available for current scope." />
          ) : (
            <ProTable>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leadRows.map((lead) => {
                  const normalizedStatus = LEAD_STATUS_VALUES.includes(lead.status as LeadStatusValue)
                    ? (lead.status as LeadStatusValue)
                    : null
                  const nextStatus = normalizedStatus
                    ? resolveRoleNextLeadStatus("ADMIN", normalizedStatus)
                    : null

                  return (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.fullName}</TableCell>
                      <TableCell>{lead.phone}</TableCell>
                      <TableCell>
                        <ProStatusBadge label={lead.status} status="pending" />
                      </TableCell>
                      <TableCell>{lead.sourceName ?? "-"}</TableCell>
                      <TableCell>{lead.assigneeName ?? "Unassigned"}</TableCell>
                      <TableCell>{formatDateTime(lead.lastActivityAt)}</TableCell>
                      <TableCell>{formatDateTime(lead.updatedAt)}</TableCell>
                      <TableCell>
                        {nextStatus ? (
                          <form action={updateWorkspaceLeadStatusAction} className="inline-flex">
                            <input type="hidden" name="leadId" value={lead.id} />
                            <input type="hidden" name="toStatus" value={nextStatus} />
                            <input type="hidden" name="nextPath" value={ROUTES.admin.leads} />
                            <ProButton type="submit" size="sm" variant="outline">
                              Move to {nextStatus}
                            </ProButton>
                          </form>
                        ) : (
                          <span className="text-xs text-muted-foreground">Final</span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </ProTable>
          )}
        </div>
      </ActionCard>

      <ActionCard
        title="WhatsApp Routing Snapshot"
        description="Current queue setup and open conversation ownership."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Queues</h3>
            {whatsapp.queues.length === 0 ? (
              <ProTableEmptyState title="No queues found" description="Queue data is currently unavailable." />
            ) : (
              <ProTable>
                <TableHeader>
                  <TableRow>
                    <TableHead>Queue</TableHead>
                    <TableHead>Strategy</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {whatsapp.queues.map((queue) => (
                    <TableRow key={queue.id}>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium">{queue.name}</span>
                          <span className="text-xs text-muted-foreground">{queue.code}</span>
                        </div>
                      </TableCell>
                      <TableCell>{queue.assignmentStrategy}</TableCell>
                      <TableCell>{queue.memberCount}</TableCell>
                      <TableCell>
                        <ProStatusBadge label={queue.isActive ? "ACTIVE" : "INACTIVE"} status={queue.isActive ? "success" : "neutral"} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </ProTable>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Open Conversations</h3>
            {whatsapp.openConversations.length === 0 ? (
              <ProTableEmptyState title="No open conversations" description="All queues are currently cleared." />
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
                  {whatsapp.openConversations.map((conversation) => (
                    <TableRow key={conversation.id}>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium">
                            {conversation.customerDisplayName ?? "Unknown"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {conversation.customerPhoneE164}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{conversation.queueName ?? "-"}</TableCell>
                      <TableCell>{conversation.ownerName ?? "Unassigned"}</TableCell>
                      <TableCell>{formatDateTime(conversation.lastMessageAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </ProTable>
            )}
          </div>
        </div>
      </ActionCard>
    </section>
  )
}
