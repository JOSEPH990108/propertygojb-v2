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
      <Card>
        <CardHeader>
          <CardTitle>Bookings</CardTitle>
          <CardDescription>
            Your assigned bookings with current status visibility.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bookingRows.length === 0 ? (
            <div className="internal-empty-state">
              No assigned bookings found.
            </div>
          ) : (
            <Table>
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
                          <Badge variant="outline">{booking.status}</Badge>
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
                                placeholder="Reason note (required for rejected/cancelled)"
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
