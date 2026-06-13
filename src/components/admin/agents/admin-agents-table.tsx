import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
    return (
      <div className="internal-empty-state">
        No agents found for the current filters.
      </div>
    )
  }

  return (
    <Table>
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
              <Badge variant={agent.isActive ? "default" : "outline"}>
                {agent.isActive ? "ACTIVE" : "INACTIVE"}
              </Badge>
            </TableCell>
            <TableCell>{formatDateTime(agent.updatedAt)}</TableCell>
            <TableCell>
              <form action={setAdminAgentActiveStateFormAction} className="inline-flex">
                <input type="hidden" name="agentUserId" value={agent.id} />
                <input type="hidden" name="isActive" value={agent.isActive ? "false" : "true"} />
                <Button size="sm" type="submit" variant="outline">
                  {agent.isActive ? "Deactivate" : "Activate"}
                </Button>
              </form>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
