import {
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
import { setAdminAgentActiveStateFormAction } from "@/lib/admin/agents/server-actions"
import type { AdminAgentListItem } from "@/lib/admin/agents/actions"

type AdminAgentsTableProps = {
  agents: AdminAgentListItem[]
}

function formatDateTime(value: string): string {
  const date = new Date(value)

  return new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

function renderAgency(agencyName: string | null, renNumber: string | null): string {
  if (agencyName && renNumber) {
    return `${agencyName} (${renNumber})`
  }

  return agencyName ?? renNumber ?? "-"
}

export function AdminAgentsTable({ agents }: AdminAgentsTableProps) {
  if (agents.length === 0) {
    return <ProTableEmptyState title="No agents found" description="Try adjusting filters or search terms." />
  }

  return (
    <ProTable>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Agency / REN</TableHead>
          <TableHead>Nationality</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Updated</TableHead>
          <TableHead>Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {agents.map((agent) => (
          <TableRow key={agent.id}>
            <TableCell className="font-medium">{agent.name}</TableCell>
            <TableCell>{agent.email}</TableCell>
            <TableCell>{agent.phoneMasked ?? "-"}</TableCell>
            <TableCell>{renderAgency(agent.agencyName, agent.renNumber)}</TableCell>
            <TableCell>{agent.nationality ?? "-"}</TableCell>
            <TableCell>
              <ProStatusBadge label={agent.isActive ? "ACTIVE" : "INACTIVE"} status={agent.isActive ? "success" : "neutral"} />
            </TableCell>
            <TableCell>{formatDateTime(agent.updatedAt)}</TableCell>
            <TableCell>
              <form action={setAdminAgentActiveStateFormAction} className="inline-flex">
                <input type="hidden" name="agentUserId" value={agent.id} />
                <input type="hidden" name="isActive" value={agent.isActive ? "false" : "true"} />
                <ProButton size="sm" type="submit" variant="outline">
                  {agent.isActive ? "Deactivate" : "Activate"}
                </ProButton>
              </form>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </ProTable>
  )
}
