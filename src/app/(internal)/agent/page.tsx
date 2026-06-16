import Link from "next/link"

import { ActionCard, MetricCard, ProButton, ProStatusBadge } from "@/components/pro-ui"
import { ROUTES } from "@/config/routes"

export default function AgentDashboardPage() {
  return (
    <section className="internal-page">
      <ActionCard title="Frontline Workspace" description="Execution view for lead engagement, appointment transitions, booking handoffs, and customer continuity.">
        <div className="space-y-2">
          <p className="internal-kicker">Agent Operations Hub</p>
          <p className="max-w-3xl text-sm text-muted-foreground">Workflow controls remain role-scoped and policy-safe.</p>

          <div className="flex flex-wrap items-center gap-2">
            <ProButton asChild variant="gradient">
              <Link href={ROUTES.agent.leads}>Open Leads</Link>
            </ProButton>
            <ProButton asChild variant="outline">
              <Link href={ROUTES.agent.bookings}>Open Bookings</Link>
            </ProButton>
            <ProButton asChild variant="outline">
              <Link href={ROUTES.agent.customers}>Open Customers</Link>
            </ProButton>
          </div>
        </div>
      </ActionCard>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ActionCard title="Leads" description="Lead queue and follow-up execution workspace." className="internal-fade-up-delay-1">
            <div className="flex items-center justify-between gap-2">
              <ProStatusBadge label="Live" status="published" />
            </div>
            <ProButton asChild size="sm" variant="outline">
              <Link href={ROUTES.agent.leads}>Open Leads</Link>
            </ProButton>
        </ActionCard>

        <ActionCard title="Bookings" description="Appointment and booking progress coordination." className="internal-fade-up-delay-1">
            <div className="flex items-center justify-between gap-2">
              <ProStatusBadge label="Live" status="published" />
            </div>
            <ProButton asChild size="sm" variant="outline">
              <Link href={ROUTES.agent.bookings}>Open Bookings</Link>
            </ProButton>
        </ActionCard>

        <ActionCard title="Customers" description="Customer pipeline context and communication history." className="internal-fade-up-delay-2">
            <div className="flex items-center justify-between gap-2">
              <ProStatusBadge label="Live" status="published" />
            </div>
            <ProButton asChild size="sm" variant="outline">
              <Link href={ROUTES.agent.customers}>Open Customers</Link>
            </ProButton>
        </ActionCard>

        <ActionCard title="Profile" description="Personal settings and preferences for agent workflows." className="internal-fade-up-delay-2">
            <div className="flex items-center justify-between gap-2">
              <ProStatusBadge label="Live" status="published" />
            </div>
            <ProButton asChild size="sm" variant="outline">
              <Link href={ROUTES.agent.profile}>Open Profile</Link>
            </ProButton>
        </ActionCard>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Focus" value="Leads" hint="Follow-up and conversion flow" />
        <MetricCard label="Pipeline" value="Bookings" hint="Status transition controls" accent="blue" />
        <MetricCard label="Portfolio" value="Customers" hint="Active account continuity" accent="green" />
      </div>
    </section>
  )
}
