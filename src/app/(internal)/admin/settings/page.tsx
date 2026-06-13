import { asc, desc, isNull, sql } from "drizzle-orm"
import Link from "next/link"

import { SignOutButton } from "@/components/auth/sign-out-button"
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
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>
            Operational settings baseline with system-setting and feature-flag visibility.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Session controls</CardTitle>
                <CardDescription>End current admin session and return to login.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <SignOutButton className="w-full sm:w-auto" />
                <div className="text-xs text-muted-foreground">
                  Use sign-out before role handoff or privileged workstation transfer.
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick links</CardTitle>
                <CardDescription>Operational routes frequently used with settings review.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href={ROUTES.admin.users}>Users</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href={ROUTES.admin.agents}>Agents</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href={ROUTES.admin.reports}>Reports</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Environment summary</CardTitle>
              <CardDescription>Active settings and enabled flags by environment.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
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
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">System settings snapshot</CardTitle>
              <CardDescription>Latest configured settings (up to 40 rows, secret values hidden).</CardDescription>
            </CardHeader>
            <CardContent>
              {settingsRows.length === 0 ? (
                <div className="internal-empty-state p-4">
                  No system settings found.
                </div>
              ) : (
                <Table>
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
                            <Badge variant={row.isActive ? "default" : "outline"}>
                              {row.isActive ? "ACTIVE" : "INACTIVE"}
                            </Badge>
                            {row.isReadOnly ? <Badge variant="outline">READ-ONLY</Badge> : null}
                            {row.isSecret ? <Badge variant="outline">SECRET-REF</Badge> : null}
                          </div>
                        </TableCell>
                        <TableCell>{formatDateTime(row.updatedAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Feature flags snapshot</CardTitle>
              <CardDescription>Latest feature flags (up to 40 rows).</CardDescription>
            </CardHeader>
            <CardContent>
              {flagRows.length === 0 ? (
                <div className="internal-empty-state p-4">
                  No feature flags found.
                </div>
              ) : (
                <Table>
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
                          <Badge variant={row.isEnabled ? "default" : "outline"}>
                            {row.isEnabled ? "ENABLED" : "DISABLED"}
                          </Badge>
                        </TableCell>
                        <TableCell>{row.sunsetAt ? formatDateTime(row.sunsetAt) : "-"}</TableCell>
                        <TableCell>{formatDateTime(row.updatedAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </section>
  )
}
