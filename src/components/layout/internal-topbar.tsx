"use client"

import { useMemo } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { adminNavigation, agentNavigation } from "@/config/navigation"
import { ROUTES } from "@/config/routes"

function resolvePageTitle(pathname: string) {
  const navigation = pathname.startsWith("/admin")
    ? adminNavigation
    : agentNavigation

  const byLongestPath = [...navigation].sort((a, b) => b.href.length - a.href.length)
  const activeItem = byLongestPath.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  )

  return activeItem?.title ?? "Workspace"
}

export function InternalTopbar() {
  const pathname = usePathname()
  const title = useMemo(() => resolvePageTitle(pathname), [pathname])
  const isAdminRoute = pathname.startsWith("/admin")

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border/70 bg-background/95 px-4 backdrop-blur md:px-6">
      <div>
        <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
          {isAdminRoute ? "Admin" : "Agent"}
        </p>
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>
      <Link
        href={isAdminRoute ? ROUTES.agent.dashboard : ROUTES.admin.dashboard}
        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        Switch to {isAdminRoute ? "Agent" : "Admin"}
      </Link>
    </header>
  )
}
