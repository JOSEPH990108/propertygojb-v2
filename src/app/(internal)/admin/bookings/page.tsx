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
import { listWorkspaceBookings } from "@/lib/internal/bookings/actions"
import { updateWorkspaceBookingStatusAction } from "@/lib/internal/bookings/server-actions"
import {
  normalizeBookingStatus,
  resolveNextBookingStatusForRole,
} from "@/lib/internal/bookings/transitions"

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

export default async function AdminBookingsPage() {
  const bookingRows = await listWorkspaceBookings({
    nextPath: ROUTES.admin.bookings,
    limit: 50,
  })

  return (
    <section className="internal-page">
      <ActionCard
        title="Bookings"
        description="Read-only booking operations baseline with status and assignment visibility."
      >
        <div>
          {bookingRows.length === 0 ? (
            <ProTableEmptyState title="No bookings available" description="No bookings available for current filters." />
          ) : (
            <ProTable>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Lead</TableHead>
                  <TableHead>Assigned Agent</TableHead>
                  <TableHead>Fee</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookingRows.map((booking) => (
                  (() => {
                    const normalizedStatus = normalizeBookingStatus(booking.status)
                    const nextStatus = normalizedStatus
                      ? resolveNextBookingStatusForRole("ADMIN", normalizedStatus)
                      : null

                    return (
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium">{booking.bookingCode}</TableCell>
                        <TableCell>
                            <ProStatusBadge label={booking.status} status="pending" />
                        </TableCell>
                        <TableCell>{booking.projectName}</TableCell>
                        <TableCell>{booking.leadName}</TableCell>
                        <TableCell>{booking.assignedAgentName ?? "Unassigned"}</TableCell>
                        <TableCell>{booking.bookingFeeAmount ?? "-"}</TableCell>
                        <TableCell>{formatDateTime(booking.updatedAt)}</TableCell>
                        <TableCell>
                          {nextStatus ? (
                            <form action={updateWorkspaceBookingStatusAction} className="inline-flex">
                              <input type="hidden" name="bookingId" value={booking.id} />
                              <input type="hidden" name="toStatus" value={nextStatus} />
                              <input type="hidden" name="nextPath" value={ROUTES.admin.bookings} />
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
