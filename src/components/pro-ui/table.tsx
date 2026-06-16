import * as React from "react"
import Link from "next/link"
import { Search, SlidersHorizontal, MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { ProBadge } from "@/components/pro-ui/badge"
import { ProInput } from "@/components/pro-ui/input"

export function ProTable({ className, ...props }: React.ComponentProps<typeof Table>) {
  return <Table className={cn("min-w-max", className)} {...props} />
}

export function ProTableToolbar({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-2xl border border-border/70 bg-surface-glass p-3 shadow-[var(--shadow-xs)]",
        className,
      )}
      {...props}
    />
  )
}

export function ProTableSearch({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <ProInput
      leftIcon={<Search className="size-4" />}
      className={cn("min-w-[280px]", className)}
      placeholder="Search..."
      {...props}
    />
  )
}

export function ProTableFilter({
  className,
  children,
  as = "button",
  showIcon = true,
  ...props
}: React.HTMLAttributes<HTMLElement> & { as?: "button" | "div"; showIcon?: boolean }) {
  const Comp = as

  return (
    <Comp
      className={cn(
        "inline-flex min-h-11 items-center gap-2 rounded-xl border border-border/70 bg-surface-glass px-3 text-sm font-medium text-foreground shadow-[var(--shadow-xs)] transition hover:border-ring/35",
        className,
      )}
      {...props}
    >
      {showIcon ? <SlidersHorizontal className="size-4" /> : null}
      {children}
    </Comp>
  )
}

function mapStatus(status: string) {
  const normalized = status.trim().toLowerCase()
  if (["active", "published", "verified", "completed", "success"].includes(normalized)) {
    return "success" as const
  }

  if (["pending", "in progress", "draft", "review"].includes(normalized)) {
    return "pending" as const
  }

  if (["reserved"].includes(normalized)) {
    return "reserved" as const
  }

  if (["sold"].includes(normalized)) {
    return "sold" as const
  }

  if (["rejected", "error", "failed", "cancelled"].includes(normalized)) {
    return "rejected" as const
  }

  return "neutral" as const
}

export function ProTableStatusBadge({ status }: { status: string }) {
  return (
    <ProBadge variant={mapStatus(status)} dot>
      {status}
    </ProBadge>
  )
}

export function ProTableEmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/70 bg-surface-glass p-8 text-center">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

export function ProTablePagination({
  page,
  totalPages,
  previousHref,
  nextHref,
}: {
  page: number
  totalPages: number
  previousHref: string
  nextHref: string
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/70 bg-surface-glass px-3 py-2 text-sm text-muted-foreground">
      <span>
        Page {page} of {totalPages}
      </span>
      <div className="flex items-center gap-2">
        <Button asChild size="sm" variant="outline" disabled={page <= 1}>
          <Link href={previousHref}>Previous</Link>
        </Button>
        <Button asChild size="sm" variant="outline" disabled={page >= totalPages}>
          <Link href={nextHref}>Next</Link>
        </Button>
      </div>
    </div>
  )
}

export function ProTableActions({
  actions,
}: {
  actions: Array<{ label: string; onSelect?: () => void; href?: string }>
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="rounded-xl">
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.map((action) => (
          <DropdownMenuItem
            key={action.label}
            onClick={action.onSelect}
            asChild={Boolean(action.href)}
          >
            {action.href ? <Link href={action.href}>{action.label}</Link> : <span>{action.label}</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
}
