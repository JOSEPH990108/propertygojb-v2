"use client"

import { useMemo } from "react"
import { usePathname } from "next/navigation"

import type { InternalTopbarProps } from "@/components/internal/shell/internal-shell-types"

function getPortalLabel(portal: InternalTopbarProps["portal"]): string {
  return portal === "admin" ? "Admin" : "Agent"
}

function getPortalSummary(portal: InternalTopbarProps["portal"]): string {
  return portal === "admin"
    ? "Operations governance, assignment controls, and delivery oversight."
    : "Lead conversion, booking updates, and customer follow-ups."
}

function resolveCurrentLabel(
  pathname: string,
  navigation: InternalTopbarProps["navigation"],
): string {
  const matched = navigation.find((item) => {
    if (item.id.endsWith("dashboard")) {
      return pathname === item.href
    }

    if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
      return true
    }

    return (item.matchPaths ?? []).some((path) => pathname === path || pathname.startsWith(`${path}/`))
  })

  return matched?.label ?? "Workspace"
}

export function InternalTopbar({ portal, navigation }: InternalTopbarProps) {
  const pathname = usePathname()
  const currentLabel = useMemo(
    () => resolveCurrentLabel(pathname, navigation),
    [pathname, navigation],
  )
  const todayLabel = useMemo(
    () => new Intl.DateTimeFormat("en-MY", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date()),
    [],
  )

  return (
    <header
      className="px-4 py-4 md:px-6 xl:px-8"
      aria-label="Internal top bar"
    >
      <div className="internal-panel flex items-center justify-between gap-3 px-4 py-3 md:px-5 md:py-4">
        <div className="space-y-1">
          <p className="internal-kicker">{getPortalLabel(portal)} Workspace</p>
          <h1 className="internal-heading text-lg font-semibold md:text-xl">{currentLabel}</h1>
          <p className="text-xs text-muted-foreground">{getPortalSummary(portal)}</p>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <div className="rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground">
            Live Workspace
          </div>
          <p className="text-xs text-muted-foreground">{todayLabel}</p>
        </div>
      </div>
    </header>
  )
}
