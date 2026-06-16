import {
  ActionCard,
  ProButton,
  ProInput,
  ProSelect,
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
  getNextLeadStatuses,
  isLeadStatusAllowedForRole,
  listWorkspaceLeads,
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

export default async function AgentLeadsPage() {
  const [leadRows, whatsapp] = await Promise.all([
    listWorkspaceLeads({
      nextPath: ROUTES.agent.leads,
      limit: 50,
    }),
    listWorkspaceWhatsappOverview({
      nextPath: ROUTES.agent.leads,
      limit: 15,
    }),
  ])

  return (
    <section className="internal-page">
      <ActionCard
        title="Leads"
        description="Your assigned leads with workflow-safe status controls and activity freshness."
      >
        <div>
          {leadRows.length === 0 ? (
            <ProTableEmptyState title="No assigned leads" description="No assigned leads found." />
          ) : (
            <ProTable>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
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
                  const candidateStatuses = normalizedStatus
                    ? getNextLeadStatuses(normalizedStatus).filter((candidate) =>
                        isLeadStatusAllowedForRole("AGENT", candidate),
                      )
                    : []

                  return (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.fullName}</TableCell>
                      <TableCell>{lead.phone}</TableCell>
                      <TableCell>
                        <ProStatusBadge label={lead.status} status="pending" />
                      </TableCell>
                      <TableCell>{lead.sourceName ?? "-"}</TableCell>
                      <TableCell>{formatDateTime(lead.lastActivityAt)}</TableCell>
                      <TableCell>{formatDateTime(lead.updatedAt)}</TableCell>
                      <TableCell>
                        {candidateStatuses.length > 0 ? (
                          <form action={updateWorkspaceLeadStatusAction} className="flex min-w-56 flex-col gap-2">
                            <input type="hidden" name="leadId" value={lead.id} />
                            <input type="hidden" name="nextPath" value={ROUTES.agent.leads} />

                            <ProSelect
                              name="toStatus"
                              defaultValue={candidateStatuses[0]}
                              options={candidateStatuses.map((status) => ({ value: status, label: status }))}
                              className="text-xs"
                            />

                            <ProInput
                              name="reasonNote"
                              placeholder="Reason note (required for LOST/SPAM)"
                              className="h-8 text-xs"
                            />

                            <ProButton type="submit" size="sm" variant="outline">
                              Update Status
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
        title="WhatsApp Open Conversations"
        description="Active conversation ownership and queue placement for your scope."
      >
        <div>
          {whatsapp.openConversations.length === 0 ? (
            <ProTableEmptyState title="No open conversations" description="No open conversations assigned to you." />
          ) : (
            <ProTable>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Queue</TableHead>
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
                    <TableCell>{formatDateTime(conversation.lastMessageAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </ProTable>
          )}
        </div>
      </ActionCard>
    </section>
  )
}
