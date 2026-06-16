"use client"

import * as React from "react"
import Link from "next/link"
import { Plus } from "lucide-react"

import { Sheet, SheetContent } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

export function ProMobileBottomNav({
  items,
  activeHref,
}: {
  items: Array<{ href: string; label: string; icon: React.ReactNode; badge?: number }>
  activeHref: string
}) {
  return (
    <nav className="fixed right-3 bottom-3 left-3 z-40 rounded-2xl border border-border/75 bg-linear-to-br from-white/95 to-surface-glass-strong p-1 shadow-[var(--shadow-lg)] ring-1 ring-white/55 backdrop-blur-md md:hidden">
      <ul className="grid grid-cols-4 gap-1">
        {items.slice(0, 4).map((item) => {
          const active = item.href === activeHref
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "relative flex min-h-11 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-medium",
                  active ? "bg-primary/12 text-primary shadow-[var(--shadow-xs)]" : "text-muted-foreground",
                )}
              >
                {item.icon}
                <span>{item.label}</span>
                {typeof item.badge === "number" && item.badge > 0 ? (
                  <span className="absolute top-1 right-2 rounded-full border border-primary/25 bg-primary/12 px-1.5 py-0.5 text-[9px] leading-none text-primary">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export function ProMobileDrawer({
  open,
  onOpenChange,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[290px] rounded-r-3xl border-r border-border/75 bg-linear-to-br from-white/94 via-surface-glass-strong to-[#efe9ff]/86 p-3 ring-1 ring-white/55 backdrop-blur-md">
        {children}
      </SheetContent>
    </Sheet>
  )
}

export function ProMobileCardList({ children }: { children: React.ReactNode }) {
  return <div className="space-y-2">{children}</div>
}

export function ProFloatingActionButton({ onClick, ariaLabel = "Quick action" }: { onClick?: () => void; ariaLabel?: string }) {
  const [expanded, setExpanded] = React.useState(false)

  const actions = [
    { id: "new-project", label: "New Project" },
    { id: "new-lead", label: "New Lead" },
  ]

  return (
    <div className="fixed right-5 bottom-24 z-40 md:hidden">
      <div className={cn("mb-2 flex flex-col items-end gap-2 transition", expanded ? "opacity-100" : "pointer-events-none opacity-0")}>
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={onClick}
            className="rounded-xl border border-border/75 bg-surface-glass-strong px-3 py-2 text-xs font-medium text-foreground shadow-[var(--shadow-sm)]"
          >
            {action.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        aria-label={ariaLabel}
        className={cn(
          "grid size-14 place-content-center rounded-full bg-linear-to-r from-[#4f6ff4] via-[#5e61f3] to-[#7c58f2] text-white shadow-[var(--shadow-lg)] ring-4 ring-primary/12 transition hover:brightness-110",
          expanded && "rotate-45 brightness-105",
        )}
      >
        <Plus className="size-6" />
      </button>
    </div>
  )
}

export function ProSwipeActionCard({
  title,
  subtitle,
  rightAction,
  leftAction,
  state = "default",
}: {
  title: string
  subtitle?: string
  leftAction?: React.ReactNode
  rightAction?: React.ReactNode
  state?: "default" | "swipe-left" | "swipe-right" | "completed"
}) {
  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl border border-border/75 bg-surface-glass p-3 shadow-[var(--shadow-xs)]",
      state === "swipe-left" && "-translate-x-2 border-destructive/35 bg-destructive-soft/45",
      state === "swipe-right" && "translate-x-2 border-success/35 bg-success-soft/45",
      state === "completed" && "border-success/35 bg-success-soft/50",
    )}>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-linear-to-r from-destructive-soft/50 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-linear-to-l from-success-soft/50 to-transparent" />
      <div className="pointer-events-none absolute top-0 right-0 bottom-0 flex items-center pr-1">{rightAction}</div>
      <div className="pointer-events-none absolute top-0 left-0 bottom-0 flex items-center pl-1">{leftAction}</div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
    </div>
  )
}
