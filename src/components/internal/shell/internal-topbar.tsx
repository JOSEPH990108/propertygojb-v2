"use client"

import { useMemo } from "react"
import { usePathname } from "next/navigation"

import type { InternalTopbarProps } from "@/components/internal/shell/internal-shell-types"

function getPortalLabel(portal: InternalTopbarProps["portal"]): string {
  return portal === "admin" ? "Admin" : "Agent"
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

  return (
    <header
      className="border-b border-border/70 bg-background/80 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6"
      aria-label="Internal top bar"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-0.5">
          <p className="text-xs tracking-[0.14em] text-muted-foreground uppercase">{getPortalLabel(portal)} Internal Portal</p>
          <h1 className="font-heading text-base font-semibold md:text-lg">{currentLabel}</h1>
        </div>
      </div>
    </header>
  )
}
