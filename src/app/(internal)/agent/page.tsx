import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ROUTES } from "@/config/routes"

export default function AgentDashboardPage() {
  return (
    <section className="internal-page">
      <Card className="internal-fade-up">
        <CardHeader className="space-y-2">
          <p className="internal-kicker">Agent Operations Hub</p>
          <CardTitle className="text-2xl">Frontline Workspace</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <p className="max-w-3xl text-sm text-muted-foreground">
            Execution view for lead engagement, appointment transitions, booking handoffs, and customer continuity.
            Workflow controls remain role-scoped and policy-safe.
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <Button asChild>
              <Link href={ROUTES.agent.leads}>Open Leads</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={ROUTES.agent.bookings}>Open Bookings</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={ROUTES.agent.customers}>Open Customers</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="internal-fade-up-delay-1">
          <CardHeader className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">Leads</CardTitle>
              <Badge variant="outline">Live</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Lead queue and follow-up execution workspace.
            </p>
          </CardHeader>
          <CardContent>
            <Button asChild size="sm" variant="outline">
              <Link href={ROUTES.agent.leads}>Open Leads</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="internal-fade-up-delay-1">
          <CardHeader className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">Bookings</CardTitle>
              <Badge variant="outline">Live</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Appointment and booking progress coordination.
            </p>
          </CardHeader>
          <CardContent>
            <Button asChild size="sm" variant="outline">
              <Link href={ROUTES.agent.bookings}>Open Bookings</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="internal-fade-up-delay-2">
          <CardHeader className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">Customers</CardTitle>
              <Badge variant="outline">Live</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Customer pipeline context and communication history.
            </p>
          </CardHeader>
          <CardContent>
            <Button asChild size="sm" variant="outline">
              <Link href={ROUTES.agent.customers}>Open Customers</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="internal-fade-up-delay-2">
          <CardHeader className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">Profile</CardTitle>
              <Badge variant="outline">Live</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Personal settings and preferences for agent workflows.
            </p>
          </CardHeader>
          <CardContent>
            <Button asChild size="sm" variant="outline">
              <Link href={ROUTES.agent.profile}>Open Profile</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
