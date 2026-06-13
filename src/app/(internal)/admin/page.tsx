import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ROUTES } from "@/config/routes"

export default function AdminDashboardPage() {
  return (
    <section className="internal-page">
      <Card className="internal-fade-up">
        <CardHeader className="space-y-2">
          <p className="internal-kicker">Admin Command Center</p>
          <CardTitle className="text-2xl">Operational Workspace</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <p className="max-w-3xl text-sm text-muted-foreground">
            Internal governance hub for workforce control, portfolio oversight, and workflow quality checks.
            Current modules remain policy-guarded and production-safe.
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <Button asChild>
              <Link href={ROUTES.admin.users}>Open Users</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={ROUTES.admin.projects}>Open Projects</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={ROUTES.admin.reports}>Open Reports</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="internal-fade-up-delay-1">
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

        <Card className="internal-fade-up-delay-1">
          <CardHeader className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">Projects</CardTitle>
              <Badge variant="outline">Live</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Project portfolio and delivery tracking module.
            </p>
          </CardHeader>
          <CardContent>
            <Button asChild size="sm" variant="outline">
              <Link href={ROUTES.admin.projects}>Open Projects</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="internal-fade-up-delay-2">
          <CardHeader className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">Leads</CardTitle>
              <Badge variant="outline">Live</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Lead routing and assignment workflows module.
            </p>
          </CardHeader>
          <CardContent>
            <Button asChild size="sm" variant="outline">
              <Link href={ROUTES.admin.leads}>Open Leads</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="internal-fade-up-delay-2">
          <CardHeader className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">Bookings</CardTitle>
              <Badge variant="outline">Live</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Booking lifecycle and status operations module.
            </p>
          </CardHeader>
          <CardContent>
            <Button asChild size="sm" variant="outline">
              <Link href={ROUTES.admin.bookings}>Open Bookings</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
