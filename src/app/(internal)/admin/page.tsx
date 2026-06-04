import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ROUTES } from "@/config/routes"

export default function AdminDashboardPage() {
  return (
    <section className="mx-auto w-full max-w-6xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Admin Dashboard</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Internal command center placeholder for operations and governance modules. Live admin workflows are added incrementally.
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-primary/30">
          <CardHeader className="space-y-2">
            <CardTitle className="text-base">User Management</CardTitle>
            <p className="text-sm text-muted-foreground">
              Manage internal users and role assignments.
            </p>
          </CardHeader>
          <CardContent>
            <Button asChild size="sm">
              <Link href={ROUTES.admin.users}>Open Users</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">Projects</CardTitle>
              <Badge variant="outline">Coming soon</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Project portfolio and delivery tracking module.
            </p>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">Leads</CardTitle>
              <Badge variant="outline">Coming soon</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Lead routing and assignment workflows module.
            </p>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">Bookings</CardTitle>
              <Badge variant="outline">Coming soon</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Booking lifecycle and status operations module.
            </p>
          </CardHeader>
        </Card>
      </div>
    </section>
  )
}
