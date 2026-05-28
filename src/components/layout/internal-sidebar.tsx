"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { adminNavigation, agentNavigation } from "@/config/navigation"
import { ROUTES } from "@/config/routes"
import { cn } from "@/lib/utils"

function isActivePath(pathname: string, href: string) {
  if (href === ROUTES.admin.dashboard || href === ROUTES.agent.dashboard) {
    return pathname === href
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}

export function InternalSidebar() {
  const pathname = usePathname()
  const isAdminRoute = pathname.startsWith("/admin")
  const navigation = isAdminRoute ? adminNavigation : agentNavigation
  const workspaceLabel = isAdminRoute ? "Admin Workspace" : "Agent Workspace"

  return (
    <aside className="hidden w-72 shrink-0 border-r border-border/70 bg-card/50 md:block">
      <div className="sticky top-0 flex h-screen flex-col p-4">
        <p className="px-3 pt-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {workspaceLabel}
        </p>

        <nav className="mt-4 space-y-1">
          {navigation.map((item) => {
            const active = isActivePath(pathname, item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {item.title}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
