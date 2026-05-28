"use client"

import { useMemo } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  getInternalAreaLabel,
  getInternalNavigation,
  getSwitchWorkspaceTarget,
  resolveInternalArea,
} from "@/components/layout/internal-workspace"

function resolvePageTitle(pathname: string) {
  const area = resolveInternalArea(pathname)
  const navigation = getInternalNavigation(area)

  const byLongestPath = [...navigation].sort((a, b) => b.href.length - a.href.length)
  const activeItem = byLongestPath.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  )

  return activeItem?.title ?? "Internal Workspace"
}

export function InternalTopbar() {
  const pathname = usePathname()
  const title = useMemo(() => resolvePageTitle(pathname), [pathname])
  const area = resolveInternalArea(pathname)
  const switchTarget = getSwitchWorkspaceTarget(area)

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border/70 bg-background/95 px-4 backdrop-blur md:px-6">
      <div>
        <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
          {getInternalAreaLabel(area)}
        </p>
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>
      {switchTarget ? (
        <Link
          href={switchTarget.href}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {switchTarget.label}
        </Link>
      ) : null}
    </header>
  )
}
