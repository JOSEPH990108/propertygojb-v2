import type { InternalNavigationItem, InternalPortal } from "@/config/internal-navigation"

export type InternalShellPortal = InternalPortal

export type InternalShellProps = {
  portal: InternalShellPortal
  children: React.ReactNode
}

export type InternalSidebarProps = {
  portal: InternalShellPortal
  navigation: readonly InternalNavigationItem[]
}

export type InternalTopbarProps = {
  portal: InternalShellPortal
  navigation: readonly InternalNavigationItem[]
}

export type InternalNavItemProps = {
  item: InternalNavigationItem
  compact?: boolean
}
