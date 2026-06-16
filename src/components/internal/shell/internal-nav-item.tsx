"use client"

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

import { ProSidebarItem } from "@/components/pro-ui"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

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

export function InternalNavItem({ item, compact = false, collapsed = false }: InternalNavItemProps) {
  const pathname = usePathname()
  const isActive = getIsActive(pathname, item)
  const Icon = iconMap[item.iconKey ?? ""] ?? BookOpenText

  const navItem = (
    <ProSidebarItem
      href={item.href}
      label={item.label}
      icon={<Icon className="size-4" aria-hidden="true" />}
      active={isActive}
      disabled={item.isPlaceholder}
      badge={item.isPlaceholder && !collapsed ? "Soon" : undefined}
      className={collapsed ? "justify-center px-2 [&>span:last-of-type]:sr-only [&>span:first-of-type]:mx-0 [&>span:first-of-type]:size-8" : undefined}
    />
  )

  return (
    <div className={compact ? "shrink-0" : undefined}>
      {collapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>{navItem}</TooltipTrigger>
          <TooltipContent side="right">{item.label}</TooltipContent>
        </Tooltip>
      ) : (
        navItem
      )}
    </div>
  )
}
