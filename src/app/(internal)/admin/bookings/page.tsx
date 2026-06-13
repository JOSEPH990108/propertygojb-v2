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
      <Card>
        <CardHeader>
          <CardTitle>Bookings</CardTitle>
          <CardDescription>
            Read-only booking operations baseline with status and assignment visibility.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bookingRows.length === 0 ? (
            <div className="internal-empty-state">
              No bookings available for current filters.
            </div>
          ) : (
            <Table>
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
                          <Badge variant="outline">{booking.status}</Badge>
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
