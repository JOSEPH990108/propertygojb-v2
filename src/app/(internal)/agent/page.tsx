import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AgentDashboardPage() {
  return (
    <section className="mx-auto grid w-full max-w-6xl gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agent Dashboard</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Initial workspace shell focused on frontline sales execution.
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pipeline Snapshot</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Lead, booking, and task metrics will be connected in later slices.
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Today Overview</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Calendar and alerts are intentionally deferred for now.
        </CardContent>
      </Card>
    </section>
  )
}
