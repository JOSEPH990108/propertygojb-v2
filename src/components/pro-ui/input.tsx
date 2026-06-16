"use client"

import * as React from "react"
import { CheckCircle2, Search, TriangleAlert, X } from "lucide-react"

import { cn } from "@/lib/utils"

type ProFieldTone = "default" | "error" | "success"

type ProFieldProps = {
  label?: string
  required?: boolean
  helperText?: string
  errorMessage?: string
  successMessage?: string
  children: React.ReactNode
  className?: string
}

function resolveTone(errorMessage?: string, successMessage?: string): ProFieldTone {
  if (errorMessage) {
    return "error"
  }

  if (successMessage) {
    return "success"
  }

  return "default"
}

export function ProField({
  label,
  required,
  helperText,
  errorMessage,
  successMessage,
  children,
  className,
}: ProFieldProps) {
  const tone = resolveTone(errorMessage, successMessage)

  return (
    <div className={cn("space-y-1.5", className)} data-tone={tone}>
      {label ? (
        <label className="text-[13px] font-medium text-foreground/90">
          {label}
          {required ? <span className="ml-1 text-destructive">*</span> : null}
        </label>
      ) : null}

      {children}

      {errorMessage ? (
        <p className="flex items-center gap-1 text-xs text-destructive">
          <TriangleAlert className="size-3.5" aria-hidden="true" />
          <span>{errorMessage}</span>
        </p>
      ) : null}

      {!errorMessage && successMessage ? (
        <p className="flex items-center gap-1 text-xs text-success-foreground">
          <CheckCircle2 className="size-3.5" aria-hidden="true" />
          <span>{successMessage}</span>
        </p>
      ) : null}

      {!errorMessage && !successMessage && helperText ? (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      ) : null}
    </div>
  )
}

type ProInputBaseProps = React.InputHTMLAttributes<HTMLInputElement> & {
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  tone?: ProFieldTone
  loading?: boolean
}

export const ProInput = React.forwardRef<HTMLInputElement, ProInputBaseProps>(
  function ProInput({ className, leftIcon, rightIcon, tone = "default", loading, ...props }, ref) {
    return (
      <div
        className={cn(
          "group flex min-h-11 w-full items-center gap-2 rounded-xl border bg-surface-glass px-3 shadow-[var(--shadow-xs)] backdrop-blur-sm transition-all duration-200",
          "hover:border-ring/35 hover:bg-background/90 focus-within:border-ring focus-within:bg-[#f8f7ff] focus-within:ring-4 focus-within:ring-ring/30",
          tone === "error" && "border-destructive/55 bg-destructive-soft/70 focus-within:ring-destructive/20",
          tone === "success" && "border-success/50 bg-success-soft/70 focus-within:ring-success/20",
          props.disabled && "opacity-60",
          className,
        )}
      >
        {leftIcon ? <span className="text-muted-foreground">{leftIcon}</span> : null}
        <input
          ref={ref}
          className="h-full w-full border-0 bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground/85"
          {...props}
        />
        {loading ? <span className="size-3 animate-spin rounded-full border-2 border-primary/40 border-t-primary" /> : null}
        {!loading && rightIcon ? <span className="text-muted-foreground">{rightIcon}</span> : null}
      </div>
    )
  },
)

export const ProTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { tone?: ProFieldTone }
>(function ProTextarea({ className, tone = "default", ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "min-h-24 w-full rounded-xl border bg-surface-glass px-3 py-2 text-sm shadow-[var(--shadow-xs)] backdrop-blur-sm outline-none transition-all duration-200 placeholder:text-muted-foreground/85",
        "hover:border-ring/35 hover:bg-background/90 focus-visible:border-ring focus-visible:bg-[#f8f7ff] focus-visible:ring-4 focus-visible:ring-ring/30",
        tone === "error" && "border-destructive/55 bg-destructive-soft/70 focus-visible:ring-destructive/20",
        tone === "success" && "border-success/50 bg-success-soft/70 focus-visible:ring-success/20",
        className,
      )}
      {...props}
    />
  )
})

export function ProSearchInput(
  {
    value,
    defaultValue,
    onClear,
    showClearButton = false,
    loading,
    ...props
  }: Omit<ProInputBaseProps, "leftIcon" | "type"> & {
    onClear?: () => void
    showClearButton?: boolean
  },
) {
  const hasValue = typeof value === "string" ? value.length > 0 : typeof defaultValue === "string" ? defaultValue.length > 0 : false

  return (
    <ProInput
      type="search"
      value={value}
      defaultValue={defaultValue}
      loading={loading}
      leftIcon={<Search className="size-4" />}
      rightIcon={
        showClearButton && hasValue ? (
          <button
            type="button"
            onClick={onClear}
            className="rounded-md border border-border/70 bg-surface-glass p-1 text-muted-foreground transition hover:bg-accent/75"
            aria-label="Clear search"
          >
            <X className="size-3" />
          </button>
        ) : undefined
      }
      {...props}
    />
  )
}

export function ProSelectTrigger({
  className,
  children,
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex min-h-11 w-full items-center justify-between rounded-xl border border-input/85 bg-surface-glass px-3 text-sm text-foreground shadow-[var(--shadow-xs)] backdrop-blur-sm transition-all duration-200 hover:border-ring/35",
        className,
      )}
    >
      {children}
    </div>
  )
}
