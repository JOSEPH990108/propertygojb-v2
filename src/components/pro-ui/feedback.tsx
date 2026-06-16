"use client"

import * as React from "react"
import { CircleAlert, CircleCheck, Info, Loader2, TriangleAlert } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { ProButton } from "@/components/pro-ui/button"
import { ProPanel } from "@/components/pro-ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type AlertTone = "success" | "warning" | "error" | "info"

const toneMap: Record<AlertTone, string> = {
  success: "border-success/35 bg-success-soft text-success-foreground",
  warning: "border-warning/35 bg-warning-soft text-warning-foreground",
  error: "border-destructive/35 bg-destructive-soft text-destructive",
  info: "border-info/35 bg-info-soft text-info-foreground",
}

const iconMap: Record<AlertTone, React.ReactNode> = {
  success: <CircleCheck className="size-4" />,
  warning: <TriangleAlert className="size-4" />,
  error: <CircleAlert className="size-4" />,
  info: <Info className="size-4" />,
}

export function ProAlert({
  tone,
  title,
  description,
}: {
  tone: AlertTone
  title: string
  description?: string
}) {
  return (
    <div className={cn("rounded-xl border px-3 py-2", toneMap[tone])}>
      <p className="flex items-center gap-2 text-sm font-semibold">
        {iconMap[tone]}
        {title}
      </p>
      {description ? <p className="mt-1 text-xs opacity-90">{description}</p> : null}
    </div>
  )
}

export function ProTooltip({
  content,
  side = "top",
  children,
}: {
  content: string
  side?: "top" | "bottom" | "left" | "right"
  children: React.ReactNode
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">{children}</span>
        </TooltipTrigger>
        <TooltipContent side={side} sideOffset={8}>
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function ProSkeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-linear-to-r from-muted via-muted/70 to-muted", className)} />
}

export function ProLoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-surface-glass px-3 py-2 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" />
      <span>{label}</span>
    </div>
  )
}

export function ProEmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <ProPanel className="space-y-3 py-8 text-center">
      <div className="mx-auto grid size-12 place-content-center rounded-2xl border border-border/70 bg-accent/50">
        <Info className="size-5 text-primary" />
      </div>
      <div className="space-y-1">
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </ProPanel>
  )
}

export function ProToastExamples() {
  return (
    <div className="flex flex-wrap gap-2">
      <ProButton size="sm" variant="success" onClick={() => toast.success("Saved successfully")}>Success</ProButton>
      <ProButton size="sm" variant="danger" onClick={() => toast.error("Something went wrong")}>Error</ProButton>
      <ProButton size="sm" variant="secondary" onClick={() => toast.warning("Please review details")}>Warning</ProButton>
      <ProButton size="sm" variant="outline" onClick={() => toast.info("Heads up: update available")}>Info</ProButton>
      <ProButton
        size="sm"
        variant="ghost"
        onClick={() => {
          const id = toast.loading("Saving changes...")
          setTimeout(() => toast.dismiss(id), 1200)
        }}
      >
        Loading
      </ProButton>
    </div>
  )
}

export function ProToast({
  tone,
  message,
  description,
}: {
  tone: "success" | "error" | "warning" | "info" | "loading"
  message: string
  description?: string
}) {
  if (tone === "success") {
    toast.success(message, { description, action: { label: "Close", onClick: () => undefined } })
    return
  }

  if (tone === "error") {
    toast.error(message, { description, action: { label: "Close", onClick: () => undefined } })
    return
  }

  if (tone === "warning") {
    toast.warning(message, { description, action: { label: "Close", onClick: () => undefined } })
    return
  }

  if (tone === "info") {
    toast.info(message, { description, action: { label: "Close", onClick: () => undefined } })
    return
  }

  toast.loading(message, { description, duration: 2200 })
}

export function ProToastTrigger({
  tone,
  message,
  description,
  children,
}: {
  tone: "success" | "error" | "warning" | "info" | "loading"
  message: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <ProButton size="sm" variant="outline" onClick={() => ProToast({ tone, message, description })}>
      {children}
    </ProButton>
  )
}
