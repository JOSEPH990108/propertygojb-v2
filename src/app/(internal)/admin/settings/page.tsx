import { asc, desc, isNull, sql } from "drizzle-orm"
import Link from "next/link"

import { SignOutButton } from "@/components/auth/sign-out-button"
import {
  ActionCard,
  MetricCard,
  ProButton,
  ProEmptyState,
  ProPanel,
  ProStatusBadge,
  ProTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/pro-ui"
import { ROUTES } from "@/config/routes"
import { db } from "@/db"
import { featureFlags, systemSettings } from "@/db/schema/settings-flags"
import { requireRole } from "@/lib/auth/guards"

function formatDateTime(value: Date): string {
  return new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value)
}

export default async function AdminSettingsPage() {
  await requireRole(["ADMIN", "SUPER_ADMIN"], {
    nextPath: ROUTES.admin.settings,
  })

  const [settingsRows, flagRows, settingsByEnvRows, flagsByEnvRows] = db
    ? await Promise.all([
        db
          .select({
            id: systemSettings.id,
            key: systemSettings.key,
            category: systemSettings.category,
            environment: systemSettings.environment,
            valueType: systemSettings.valueType,
            isSecret: systemSettings.isSecret,
            isReadOnly: systemSettings.isReadOnly,
            isActive: systemSettings.isActive,
            updatedAt: systemSettings.updatedAt,
          })
          .from(systemSettings)
          .where(isNull(systemSettings.deletedAt))
          .orderBy(asc(systemSettings.category), asc(systemSettings.key))
          .limit(40),
        db
          .select({
            id: featureFlags.id,
            key: featureFlags.key,
            name: featureFlags.name,
            category: featureFlags.category,
            environment: featureFlags.environment,
            isEnabled: featureFlags.isEnabled,
            rolloutMode: featureFlags.rolloutMode,
            rolloutPercentage: featureFlags.rolloutPercentage,
            sunsetAt: featureFlags.sunsetAt,
            updatedAt: featureFlags.updatedAt,
          })
          .from(featureFlags)
          .where(isNull(featureFlags.deletedAt))
          .orderBy(desc(featureFlags.updatedAt), featureFlags.key)
          .limit(40),
        db
          .select({
            environment: systemSettings.environment,
            total: sql<number>`count(*)::int`,
            active: sql<number>`sum(case when ${systemSettings.isActive} then 1 else 0 end)::int`,
          })
          .from(systemSettings)
          .where(isNull(systemSettings.deletedAt))
          .groupBy(systemSettings.environment)
          .orderBy(systemSettings.environment),
        db
          .select({
            environment: featureFlags.environment,
            total: sql<number>`count(*)::int`,
            enabled: sql<number>`sum(case when ${featureFlags.isEnabled} then 1 else 0 end)::int`,
          })
          .from(featureFlags)
          .where(isNull(featureFlags.deletedAt))
          .groupBy(featureFlags.environment)
          .orderBy(featureFlags.environment),
      ])
    : [[], [], [], []]

  return (
    <section className="internal-page">
      <ActionCard
        title="Settings"
        description="Operational settings baseline with system-setting and feature-flag visibility."
      >
        <div className="space-y-4">
          <ProPanel className="grid gap-3 md:grid-cols-2">
            <ProPanel className="space-y-3">
              <div>
                <h3 className="text-base font-semibold text-foreground">Session controls</h3>
                <p className="text-sm text-muted-foreground">End current admin session and return to login.</p>
              </div>
              <div className="space-y-3">
                <SignOutButton className="w-full sm:w-auto" />
                <div className="text-xs text-muted-foreground">
                  Use sign-out before role handoff or privileged workstation transfer.
                </div>
              </div>
            </ProPanel>

            <ProPanel className="space-y-3">
              <div>
                <h3 className="text-base font-semibold text-foreground">Quick links</h3>
                <p className="text-sm text-muted-foreground">Operational routes frequently used with settings review.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <ProButton asChild size="sm" variant="outline">
                  <Link href={ROUTES.admin.users}>Users</Link>
                </ProButton>
                <ProButton asChild size="sm" variant="outline">
                  <Link href={ROUTES.admin.agents}>Agents</Link>
                </ProButton>
                <ProButton asChild size="sm" variant="outline">
                  <Link href={ROUTES.admin.reports}>Reports</Link>
                </ProButton>
              </div>
            </ProPanel>
          </ProPanel>

          <div className="grid gap-3 md:grid-cols-2">
            <MetricCard label="System settings sampled" value={settingsRows.length} hint="Latest 40 rows" />
            <MetricCard label="Feature flags sampled" value={flagRows.length} hint="Latest 40 rows" accent="blue" />
          </div>

          <ProPanel className="space-y-3">
            <div>
              <h3 className="text-base font-semibold text-foreground">Environment summary</h3>
              <p className="text-sm text-muted-foreground">Active settings and enabled flags by environment.</p>
            </div>
            <ProTable>
                <TableHeader>
                  <TableRow>
                    <TableHead>Environment</TableHead>
                    <TableHead>Settings (active / total)</TableHead>
                    <TableHead>Feature flags (enabled / total)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settingsByEnvRows.length === 0 && flagsByEnvRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-sm text-muted-foreground">
                        No settings baseline records found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    [...new Set([...settingsByEnvRows.map((row) => row.environment), ...flagsByEnvRows.map((row) => row.environment)])].map((environment) => {
                      const settingsEnv = settingsByEnvRows.find((row) => row.environment === environment)
                      const flagsEnv = flagsByEnvRows.find((row) => row.environment === environment)

                      return (
                        <TableRow key={environment}>
                          <TableCell className="font-medium">{environment}</TableCell>
                          <TableCell>
                            {settingsEnv ? `${settingsEnv.active} / ${settingsEnv.total}` : "0 / 0"}
                          </TableCell>
                          <TableCell>
                            {flagsEnv ? `${flagsEnv.enabled} / ${flagsEnv.total}` : "0 / 0"}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </ProTable>
            </ProPanel>

            <ProPanel className="space-y-3">
              <div>
                <h3 className="text-base font-semibold text-foreground">System settings snapshot</h3>
                <p className="text-sm text-muted-foreground">Latest configured settings (up to 40 rows, secret values hidden).</p>
              </div>
              {settingsRows.length === 0 ? (
                  <ProEmptyState title="No system settings" description="No system settings found." />
              ) : (
                  <ProTable>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Key</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Environment</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Flags</TableHead>
                      <TableHead>Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {settingsRows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">{row.key}</TableCell>
                        <TableCell>{row.category}</TableCell>
                        <TableCell>{row.environment}</TableCell>
                        <TableCell>{row.valueType}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap items-center gap-1">
                            <ProStatusBadge
                              label={row.isActive ? "ACTIVE" : "INACTIVE"}
                              status={row.isActive ? "success" : "neutral"}
                            />
                            {row.isReadOnly ? <ProStatusBadge label="READ-ONLY" status="info" mode="outline" /> : null}
                            {row.isSecret ? <ProStatusBadge label="SECRET-REF" status="warning" mode="outline" /> : null}
                          </div>
                        </TableCell>
                        <TableCell>{formatDateTime(row.updatedAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </ProTable>
              )}
          </ProPanel>

          <ProPanel className="space-y-3">
            <div>
              <h3 className="text-base font-semibold text-foreground">Feature flags snapshot</h3>
              <p className="text-sm text-muted-foreground">Latest feature flags (up to 40 rows).</p>
            </div>
            {flagRows.length === 0 ? (
                <ProEmptyState title="No feature flags" description="No feature flags found." />
              ) : (
                <ProTable>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Key</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Environment</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Rollout</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sunset</TableHead>
                      <TableHead>Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {flagRows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">{row.key}</TableCell>
                        <TableCell>{row.name}</TableCell>
                        <TableCell>{row.environment}</TableCell>
                        <TableCell>{row.category ?? "-"}</TableCell>
                        <TableCell>
                          {row.rolloutMode}
                          {row.rolloutPercentage !== null ? ` (${row.rolloutPercentage}%)` : ""}
                        </TableCell>
                        <TableCell>
                          <ProStatusBadge
                            label={row.isEnabled ? "ENABLED" : "DISABLED"}
                            status={row.isEnabled ? "success" : "neutral"}
                          />
                        </TableCell>
                        <TableCell>{row.sunsetAt ? formatDateTime(row.sunsetAt) : "-"}</TableCell>
                        <TableCell>{formatDateTime(row.updatedAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </ProTable>
              )}
          </ProPanel>
        </div>
      </ActionCard>
    </section>
  )
}
