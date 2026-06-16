"use client"

import Link from "next/link"
import { ChevronDown, ShieldCheck } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

type ProSidebarItemProps = {
  href: string
  label: string
  icon: React.ReactNode
  active?: boolean
  disabled?: boolean
  badge?: string | number
  className?: string
}

export function ProSidebarItem({ href, label, icon, active, disabled, badge, className }: ProSidebarItemProps) {
  return (
    <Link
      href={href}
      aria-disabled={disabled}
      className={cn(
        "group relative flex min-h-11 items-center gap-2.5 rounded-xl border border-transparent px-3 text-[13px] font-medium text-muted-foreground transition-all",
        "hover:border-border/65 hover:bg-[#f6f3ff] hover:text-foreground",
        active && "border-primary/25 bg-[#f3efff] text-primary shadow-[var(--shadow-xs)] before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded-r-full before:bg-primary",
        disabled && "pointer-events-none opacity-45",
        className,
      )}
    >
      <span className={cn("grid size-7 place-content-center rounded-lg border border-border/60 bg-linear-to-br from-white/95 to-surface-glass shadow-[var(--shadow-xs)]", active && "border-primary/25 bg-primary/12 text-primary")}>
        {icon}
      </span>
      <span className="truncate">{label}</span>
      {badge ? (
        <Badge className="ml-auto rounded-full border-primary/20 bg-primary/12 px-2 text-[10px] text-primary" variant="outline">
          {badge}
        </Badge>
      ) : null}
    </Link>
  )
}

export function ProSidebarSection({
  title,
  children,
  className,
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn("space-y-1.5", className)}>
      <p className="px-3 text-[0.67rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{title}</p>
      <div className="space-y-1">{children}</div>
    </section>
  )
}

export function ProSidebarWorkspace({ name, plan }: { name: string; plan: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-linear-to-br from-white/92 to-surface-glass p-2.5 shadow-[var(--shadow-xs)]">
      <div className="flex items-center justify-between gap-2">
        <div className="space-y-0.5">
          <p className="text-xs font-semibold text-foreground">{name}</p>
          <p className="text-[11px] text-muted-foreground">{plan}</p>
        </div>
        <ChevronDown className="size-4 text-muted-foreground" />
      </div>
    </div>
  )
}

export function ProSidebarRoleTag({ role }: { role: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-primary">
      <ShieldCheck className="size-3" />
      {role}
    </span>
  )
}

export function ProSidebarContainer({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <aside
      className={cn("rounded-[28px] border border-border/70 bg-linear-to-br from-white/92 via-surface-glass-strong to-[#efe9ff]/88 p-3 shadow-[var(--shadow-md)] ring-1 ring-white/55 backdrop-blur-md", className)}
      {...props}
    />
  )
}

export function ProMobileSidebar({
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
      <SheetContent side="left" className="w-[300px] rounded-r-3xl border-r border-border/75 bg-surface-glass-strong p-0 backdrop-blur-md">
        <div className="h-full p-3">{children}</div>
      </SheetContent>
    </Sheet>
  )
}
