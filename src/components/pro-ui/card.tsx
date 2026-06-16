import * as React from "react"

import { cn } from "@/lib/utils"

type DivProps = React.HTMLAttributes<HTMLDivElement>

export function ProCard({ className, ...props }: DivProps) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-border/70 bg-linear-to-br from-white/88 via-surface-glass to-[#f5f1ff]/86 p-5 shadow-[var(--shadow-md)] ring-1 ring-white/55 backdrop-blur-md",
        className,
      )}
      {...props}
    />
  )
}

export function ProPanel({ className, ...props }: DivProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/70 bg-linear-to-br from-white/86 via-surface-glass to-[#f8f6ff]/88 p-4 shadow-[var(--shadow-sm)] ring-1 ring-white/45 backdrop-blur-sm",
        className,
      )}
      {...props}
    />
  )
}

export function GlassCard({ className, ...props }: DivProps) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-border/70 bg-linear-to-br from-white/92 via-surface-glass-strong to-[#f1ebff]/88 p-5 shadow-[var(--shadow-lg)] ring-1 ring-white/60 backdrop-blur-md",
        className,
      )}
      {...props}
    />
  )
}

type MetricCardProps = DivProps & {
  label: string
  value: React.ReactNode
  hint?: React.ReactNode
  accent?: "purple" | "blue" | "green" | "amber"
}

const accentMap: Record<NonNullable<MetricCardProps["accent"]>, string> = {
  purple: "from-[#5e61f3]/20 to-transparent text-primary",
  blue: "from-[#4b83f6]/20 to-transparent text-info",
  green: "from-[#22b573]/20 to-transparent text-success",
  amber: "from-[#f2b84f]/20 to-transparent text-warning",
}

export function MetricCard({
  className,
  label,
  value,
  hint,
  accent = "purple",
  ...props
}: MetricCardProps) {
  return (
    <ProPanel
      className={cn("relative overflow-hidden", className)}
      {...props}
    >
      <div className={cn("pointer-events-none absolute inset-0 bg-linear-to-br", accentMap[accent])} />
      <div className="relative space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
    </ProPanel>
  )
}

type ActionCardProps = DivProps & {
  title: string
  description?: string
  action?: React.ReactNode
}

export function ActionCard({ title, description, action, className, children, ...props }: ActionCardProps) {
  return (
    <GlassCard className={cn("space-y-4", className)} {...props}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-xl font-semibold tracking-tight text-foreground">{title}</h3>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </GlassCard>
  )
}

type EmptyStateCardProps = DivProps & {
  title: string
  description: string
  icon?: React.ReactNode
  action?: React.ReactNode
}

export function EmptyStateCard({ title, description, icon, action, className, ...props }: EmptyStateCardProps) {
  return (
    <ProPanel className={cn("flex flex-col items-center justify-center gap-3 py-8 text-center", className)} {...props}>
      <div className="grid size-12 place-content-center rounded-2xl border border-border/70 bg-accent/55 text-primary">
        {icon}
      </div>
      <div className="space-y-1">
        <h4 className="text-base font-semibold text-foreground">{title}</h4>
        <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </ProPanel>
  )
}
