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
      <ActionCard title="Documents" description="Booking document request baseline with status visibility.">
        <div>
          {rows.length === 0 ? (
            <ProTableEmptyState title="No document requests" description="No document requests available." />
          ) : (
            <ProTable>
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
                          <ProStatusBadge label={item.requestStatus} status="pending" />
                        </TableCell>
                        <TableCell>{formatDateTime(item.dueAt)}</TableCell>
                        <TableCell>{formatDateTime(item.requestedAt)}</TableCell>
                        <TableCell>
                          {nextStatus ? (
                            <form action={updateWorkspaceDocumentRequestStatusAction} className="inline-flex">
                              <input type="hidden" name="requestId" value={item.id} />
                              <input type="hidden" name="toStatus" value={nextStatus} />
                              <input type="hidden" name="nextPath" value={ROUTES.admin.documents} />
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
                  })()
                ))}
              </TableBody>
            </ProTable>
          )}
        </div>
      </ActionCard>
    </section>
  )
}
