import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const proBadgeVariants = cva(
  "inline-flex min-h-6 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
  {
    variants: {
      variant: {
        success: "border-success/30 bg-success-soft text-success-foreground",
        warning: "border-warning/35 bg-warning-soft text-warning-foreground",
        error: "border-destructive/35 bg-destructive-soft text-destructive",
        info: "border-info/35 bg-info-soft text-info-foreground",
        neutral: "border-border/70 bg-surface-glass text-muted-foreground",
        purple: "border-primary/25 bg-primary/12 text-primary",
        blue: "border-info/35 bg-info-soft text-info-foreground",
        draft: "border-border/70 bg-muted text-muted-foreground",
        published: "border-success/30 bg-success-soft text-success-foreground",
        reserved: "border-primary/25 bg-primary/12 text-primary",
        sold: "border-info/35 bg-info-soft text-info-foreground",
        pending: "border-warning/35 bg-warning-soft text-warning-foreground",
        verified: "border-success/30 bg-success-soft text-success-foreground",
        rejected: "border-destructive/35 bg-destructive-soft text-destructive",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
)

export type ProBadgeProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof proBadgeVariants> & {
    dot?: boolean
    icon?: React.ReactNode
  }

export function ProBadge({ className, variant, dot, icon, children, ...props }: ProBadgeProps) {
  return (
    <span className={cn(proBadgeVariants({ variant }), className)} {...props}>
      {dot ? <span className="size-1.5 rounded-full bg-current" /> : null}
      {icon}
      <span>{children}</span>
    </span>
  )
}

type ProStatusBadgeProps = {
  label: string
  status?: VariantProps<typeof proBadgeVariants>["variant"]
  dot?: boolean
  icon?: React.ReactNode
  count?: number
  mode?: "soft" | "outline"
  className?: string
}

export function ProStatusBadge({
  label,
  status = "neutral",
  dot,
  icon,
  count,
  mode = "soft",
  className,
}: ProStatusBadgeProps) {
  return (
    <ProBadge
      variant={status}
      dot={dot}
      icon={icon}
      className={cn(mode === "outline" && "bg-transparent", className)}
    >
      {label}
      {typeof count === "number" ? (
        <span className="ml-1 rounded-full bg-current/12 px-1.5 py-0.5 text-[10px]">{count}</span>
      ) : null}
    </ProBadge>
  )
}

export { proBadgeVariants }
