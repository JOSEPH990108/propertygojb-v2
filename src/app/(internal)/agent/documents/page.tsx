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
import { listWorkspaceDocumentRequests } from "@/lib/internal/documents/actions"
import { updateWorkspaceDocumentRequestStatusAction } from "@/lib/internal/documents/server-actions"
import {
  getNextDocumentRequestStatuses,
  isDocumentRequestStatusAllowedForRole,
  normalizeDocumentRequestStatus,
} from "@/lib/internal/documents/transitions"

function formatDateTime(value: string | null): string {
  if (!value) {
    return "-"
  }

  return new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

export default async function AgentDocumentsPage() {
  const rows = await listWorkspaceDocumentRequests({
    nextPath: ROUTES.agent.documents,
    limit: 50,
  })

  return (
    <section className="internal-page">
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
          <CardDescription>
            Document requests for bookings assigned to your queue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <div className="internal-empty-state">
              No document requests found for your current scope.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking</TableHead>
                  <TableHead>Document Type</TableHead>
                  <TableHead>Participant</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((item) => (
                  (() => {
                    const normalizedStatus = normalizeDocumentRequestStatus(item.requestStatus)
                    const candidateStatuses = normalizedStatus
                      ? getNextDocumentRequestStatuses(normalizedStatus).filter((candidate) =>
                          isDocumentRequestStatusAllowedForRole("AGENT", candidate),
                        )
                      : []

                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.bookingCode}</TableCell>
                        <TableCell>{item.documentTypeName}</TableCell>
                        <TableCell>{item.participantName ?? "Booking-level"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.requestStatus}</Badge>
                        </TableCell>
                        <TableCell>{formatDateTime(item.dueAt)}</TableCell>
                        <TableCell>{formatDateTime(item.requestedAt)}</TableCell>
                        <TableCell>
                          {candidateStatuses.length > 0 ? (
                            <form
                              action={updateWorkspaceDocumentRequestStatusAction}
                              className="flex min-w-56 flex-col gap-2"
                            >
                              <input type="hidden" name="requestId" value={item.id} />
                              <input type="hidden" name="nextPath" value={ROUTES.agent.documents} />

                              <select
                                name="toStatus"
                                defaultValue={candidateStatuses[0]}
                                className="internal-form-select text-xs"
                              >
                                {candidateStatuses.map((status) => (
                                  <option key={status} value={status}>
                                    {status}
                                  </option>
                                ))}
                              </select>

                              <Input
                                name="reasonNote"
                                placeholder="Reason note (required for waived status)"
                                className="h-8 text-xs"
                              />

                              <Button type="submit" size="sm" variant="outline">
                                Update Status
                              </Button>
                            </form>
                          ) : (
                            <span className="text-xs text-muted-foreground">No action</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })()
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
