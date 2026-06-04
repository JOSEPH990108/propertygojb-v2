import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AgentDashboardPage() {
  return (
    <section className="mx-auto w-full max-w-6xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Agent Dashboard</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Agent workspace placeholder for frontline execution modules. Operational tools are being delivered in later phases.
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">Leads</CardTitle>
              <Badge variant="outline">Coming soon</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Lead queue and follow-up execution workspace.
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
              Appointment and booking progress coordination.
            </p>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">Customers</CardTitle>
              <Badge variant="outline">Coming soon</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Customer pipeline context and communication history.
            </p>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">Profile</CardTitle>
              <Badge variant="outline">Coming soon</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Personal settings and preferences for agent workflows.
            </p>
          </CardHeader>
        </Card>
      </div>
    </section>
  )
}
