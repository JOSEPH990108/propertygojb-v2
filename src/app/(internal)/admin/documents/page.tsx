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
import { listWorkspaceDocumentRequests } from "@/lib/internal/documents/actions"
import { updateWorkspaceDocumentRequestStatusAction } from "@/lib/internal/documents/server-actions"
import {
  normalizeDocumentRequestStatus,
  resolveNextDocumentRequestStatusForRole,
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

export default async function AdminDocumentsPage() {
  const rows = await listWorkspaceDocumentRequests({
    nextPath: ROUTES.admin.documents,
    limit: 50,
  })

  return (
    <section className="internal-page">
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
          <CardDescription>
            Booking document request baseline with status visibility.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <div className="internal-empty-state">
              No document requests available.
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
                    const nextStatus = normalizedStatus
                      ? resolveNextDocumentRequestStatusForRole("ADMIN", normalizedStatus)
                      : null

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
                          {nextStatus ? (
                            <form action={updateWorkspaceDocumentRequestStatusAction} className="inline-flex">
                              <input type="hidden" name="requestId" value={item.id} />
                              <input type="hidden" name="toStatus" value={nextStatus} />
                              <input type="hidden" name="nextPath" value={ROUTES.admin.documents} />
                              <Button type="submit" size="sm" variant="outline">
                                Move to {nextStatus}
                              </Button>
                            </form>
                          ) : (
                            <span className="text-xs text-muted-foreground">Final</span>
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
