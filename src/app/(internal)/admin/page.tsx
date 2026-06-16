import Link from "next/link"

import { ActionCard, MetricCard, ProButton, ProStatusBadge } from "@/components/pro-ui"
import { ROUTES } from "@/config/routes"

export default function AdminDashboardPage() {
  return (
    <section className="internal-page">
      <ActionCard title="Operational Workspace" description="Internal governance hub for workforce control, portfolio oversight, and workflow quality checks.">
        <div className="space-y-2">
          <p className="internal-kicker">Admin Command Center</p>
          <p className="max-w-3xl text-sm text-muted-foreground">Current modules remain policy-guarded and production-safe.</p>
          <div className="flex flex-wrap items-center gap-2">
            <ProButton asChild variant="gradient">
              <Link href={ROUTES.admin.users}>Open Users</Link>
            </ProButton>
            <ProButton asChild variant="outline">
              <Link href={ROUTES.admin.projects}>Open Projects</Link>
            </ProButton>
            <ProButton asChild variant="outline">
              <Link href={ROUTES.admin.reports}>Open Reports</Link>
            </ProButton>
          </div>
        </div>
      </ActionCard>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ActionCard title="User Management" description="Manage internal users and role assignments." className="internal-fade-up-delay-1">
          <ProButton asChild size="sm">
              <Link href={ROUTES.admin.users}>Open Users</Link>
          </ProButton>
        </ActionCard>

        <ActionCard title="Projects" description="Project portfolio and delivery tracking module." className="internal-fade-up-delay-1">
            <div className="flex items-center justify-between gap-2">
              <ProStatusBadge label="Live" status="published" />
            </div>
            <ProButton asChild size="sm" variant="outline">
              <Link href={ROUTES.admin.projects}>Open Projects</Link>
            </ProButton>
        </ActionCard>

        <ActionCard title="Leads" description="Lead routing and assignment workflows module." className="internal-fade-up-delay-2">
            <div className="flex items-center justify-between gap-2">
              <ProStatusBadge label="Live" status="published" />
            </div>
            <ProButton asChild size="sm" variant="outline">
              <Link href={ROUTES.admin.leads}>Open Leads</Link>
            </ProButton>
        </ActionCard>

        <ActionCard title="Bookings" description="Booking lifecycle and status operations module." className="internal-fade-up-delay-2">
            <div className="flex items-center justify-between gap-2">
              <ProStatusBadge label="Live" status="published" />
            </div>
            <ProButton asChild size="sm" variant="outline">
              <Link href={ROUTES.admin.bookings}>Open Bookings</Link>
            </ProButton>
        </ActionCard>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Ops Focus" value="Users" hint="Access control and policy checks" />
        <MetricCard label="Pipeline" value="Leads" hint="Assignment and conversion controls" accent="blue" />
        <MetricCard label="Closures" value="Bookings" hint="Lifecycle status integrity" accent="green" />
      </div>
    </section>
  )
}
