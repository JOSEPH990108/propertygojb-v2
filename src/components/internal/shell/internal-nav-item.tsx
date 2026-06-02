"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BookOpenText,
  Building2,
  CalendarCheck2,
  CircleUser,
  Home,
  LayoutDashboard,
  Settings,
  UserRoundSearch,
  Users,
  type LucideIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

import type { InternalNavItemProps } from "@/components/internal/shell/internal-shell-types"

const iconMap: Record<string, LucideIcon> = {
  "layout-dashboard": LayoutDashboard,
  users: Users,
  "building-2": Building2,
  home: Home,
  "user-round-search": UserRoundSearch,
  "calendar-check-2": CalendarCheck2,
  settings: Settings,
  "circle-user": CircleUser,
}

function getIsActive(pathname: string, item: InternalNavItemProps["item"]): boolean {
  const isDashboard = item.id.endsWith("dashboard")
  if (isDashboard) {
    return pathname === item.href
  }

  if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
    return true
  }

  if (!item.matchPaths || item.matchPaths.length === 0) {
    return false
  }

  return item.matchPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}

export function InternalNavItem({ item, compact = false }: InternalNavItemProps) {
  const pathname = usePathname()
  const isActive = getIsActive(pathname, item)
  const Icon = iconMap[item.iconKey ?? ""] ?? BookOpenText

  return (
    <Link
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      aria-label={`${item.label}${item.isPlaceholder ? " (placeholder)" : ""}`}
      className={cn(
        "group flex items-center gap-2 rounded-lg border border-transparent px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
        isActive && "border-border bg-card text-foreground shadow-xs",
        compact && "shrink-0"
      )}
    >
      <Icon className="size-4" aria-hidden="true" />
      <span className="font-medium">{item.label}</span>
      {item.isPlaceholder ? (
        <Badge variant="outline" className="ml-auto text-[10px]">
          Soon
        </Badge>
      ) : null}
    </Link>
  )
}
