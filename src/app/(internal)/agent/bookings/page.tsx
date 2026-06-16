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
import { listWorkspaceBookings } from "@/lib/internal/bookings/actions"
import { updateWorkspaceBookingStatusAction } from "@/lib/internal/bookings/server-actions"
import {
  getNextBookingStatuses,
  isBookingStatusAllowedForRole,
  normalizeBookingStatus,
} from "@/lib/internal/bookings/transitions"

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

export default async function AgentBookingsPage() {
  const bookingRows = await listWorkspaceBookings({
    nextPath: ROUTES.agent.bookings,
    limit: 50,
  })

  return (
    <section className="internal-page">
      <ActionCard title="Bookings" description="Your assigned bookings with current status visibility.">
        <div>
          {bookingRows.length === 0 ? (
            <ProTableEmptyState title="No assigned bookings" description="No assigned bookings found." />
          ) : (
            <ProTable>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Lead</TableHead>
                  <TableHead>Fee</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookingRows.map((booking) => (
                  (() => {
                    const normalizedStatus = normalizeBookingStatus(booking.status)
                    const candidateStatuses = normalizedStatus
                      ? getNextBookingStatuses(normalizedStatus).filter((candidate) =>
                          isBookingStatusAllowedForRole("AGENT", candidate),
                        )
                      : []

                    return (
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium">{booking.bookingCode}</TableCell>
                        <TableCell>
                          <ProStatusBadge label={booking.status} status="pending" />
                        </TableCell>
                        <TableCell>{booking.projectName}</TableCell>
                        <TableCell>{booking.leadName}</TableCell>
                        <TableCell>{booking.bookingFeeAmount ?? "-"}</TableCell>
                        <TableCell>{formatDateTime(booking.updatedAt)}</TableCell>
                        <TableCell>
                          {candidateStatuses.length > 0 ? (
                            <form action={updateWorkspaceBookingStatusAction} className="flex min-w-56 flex-col gap-2">
                              <input type="hidden" name="bookingId" value={booking.id} />
                              <input type="hidden" name="nextPath" value={ROUTES.agent.bookings} />

                              <ProSelect
                                name="toStatus"
                                defaultValue={candidateStatuses[0]}
                                options={candidateStatuses.map((status) => ({ value: status, label: status }))}
                                className="text-xs"
                              />

                              <ProInput
                                name="reasonNote"
                                placeholder="Reason note (required for rejected/cancelled)"
                                className="h-8 text-xs"
                              />

                              <ProButton type="submit" size="sm" variant="outline">
                                Update Status
                              </ProButton>
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
            </ProTable>
          )}
        </div>
      </ActionCard>
    </section>
  )
}
