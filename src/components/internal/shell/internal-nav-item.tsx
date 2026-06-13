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
        "group flex items-center gap-2.5 rounded-xl border border-transparent px-3 py-2.5 text-sm text-muted-foreground transition-all hover:border-border/70 hover:bg-background/82 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
        isActive && "border-border/80 bg-background text-foreground shadow-[0_10px_22px_-16px_rgba(15,23,42,0.85)]",
        compact && "shrink-0"
      )}
    >
      <span
        className={cn(
          "flex size-7 items-center justify-center rounded-lg border border-border/50 bg-background/70 text-muted-foreground transition-colors",
          isActive && "border-border/80 bg-card text-foreground",
        )}
      >
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <span className="font-medium">{item.label}</span>
      {item.isPlaceholder ? (
        <Badge variant="outline" className="ml-auto border-border/80 bg-background/70 text-[10px]">
          Soon
        </Badge>
      ) : null}
    </Link>
  )
}
