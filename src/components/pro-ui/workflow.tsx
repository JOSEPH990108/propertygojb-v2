"use client"

import * as React from "react"
import {
  CheckCircle2,
  CircleAlert,
  CircleCheckBig,
  FileUp,
  Upload,
  XCircle,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { ProButton } from "@/components/pro-ui/button"
import { ProBadge } from "@/components/pro-ui/badge"
import { ProPanel } from "@/components/pro-ui/card"

export type ProStepState = "default" | "active" | "completed" | "error" | "disabled"

function ProStepIndicator({
  index,
  state,
}: {
  index: number
  state: ProStepState
}) {
  const icon =
    state === "completed" ? (
      <CircleCheckBig className="size-4" />
    ) : state === "error" ? (
      <CircleAlert className="size-4" />
    ) : (
      <span>{index}</span>
    )

  return (
    <span
      className={cn(
        "grid size-6 place-content-center rounded-full border text-xs font-semibold",
        state === "default" && "border-border/70 bg-surface-glass text-muted-foreground",
        state === "active" && "border-primary/30 bg-primary/12 text-primary",
        state === "completed" && "border-success/30 bg-success-soft text-success-foreground",
        state === "error" && "border-destructive/40 bg-destructive-soft text-destructive",
        state === "disabled" && "border-border/60 bg-muted text-muted-foreground/65",
      )}
    >
      {icon}
    </span>
  )
}

export function ProStep({
  index,
  label,
  state,
}: {
  index: number
  label: string
  state: ProStepState
}) {
  return (
    <div className="flex items-center gap-2">
      <ProStepIndicator index={index} state={state} />
      <span className={cn("text-xs font-medium", state === "disabled" ? "text-muted-foreground/60" : "text-foreground/85")}>{label}</span>
    </div>
  )
}

export function ProStepper({
  steps,
  orientation = "horizontal",
}: {
  steps: Array<{ label: string; state: ProStepState }>
  orientation?: "horizontal" | "vertical"
}) {
  if (orientation === "vertical") {
    return (
      <div className="space-y-2">
        {steps.map((step, index) => (
          <div key={`${step.label}-${index}`} className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-2">
            <div className="relative flex justify-center">
              <ProStepIndicator index={index + 1} state={step.state} />
              {index < steps.length - 1 ? <span className="absolute top-6 h-6 w-px bg-primary/30" /> : null}
            </div>
            <span className={cn("pt-1 text-xs font-medium", step.state === "disabled" ? "text-muted-foreground/60" : "text-foreground/85")}>{step.label}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center">
        {steps.map((step, index) => (
          <React.Fragment key={`${step.label}-${index}`}>
            <ProStepIndicator index={index + 1} state={step.state} />
            {index < steps.length - 1 ? <span className="mx-2 h-px min-w-6 flex-1 bg-primary/30" /> : null}
          </React.Fragment>
        ))}
      </div>
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${Math.max(steps.length, 1)}, minmax(0, 1fr))` }}
      >
        {steps.map((step, index) => (
          <span
            key={`${step.label}-${index}-label`}
            className={cn("text-xs font-medium", step.state === "disabled" ? "text-muted-foreground/60" : "text-foreground/85")}
          >
            {step.label}
          </span>
        ))}
      </div>
    </div>
  )
}

export type ProFileItemState = "uploading" | "success" | "error"

export function ProFileUpload({
  files,
  onBrowse,
}: {
  files: Array<{ id: string; name: string; size: string; state: ProFileItemState; progress?: number }>
  onBrowse?: () => void
}) {
  return (
    <ProPanel className="space-y-3">
      <button
        type="button"
        onClick={onBrowse}
        className="flex min-h-28 w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/35 bg-[#f8f5ff] text-center"
      >
        <span className="grid size-10 place-content-center rounded-xl bg-primary/12 text-primary">
          <Upload className="size-5" />
        </span>
        <span className="text-sm font-semibold text-foreground">Drag and drop files here</span>
        <span className="text-xs text-muted-foreground">or click to browse</span>
      </button>

      <div className="space-y-2">
        {files.map((file) => (
          <div key={file.id} className="rounded-xl border border-border/70 bg-surface-glass px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileUp className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-xs font-semibold text-foreground">{file.name}</p>
                  <p className="text-[11px] text-muted-foreground">{file.size}</p>
                </div>
              </div>

              {file.state === "success" ? <CheckCircle2 className="size-4 text-success" /> : null}
              {file.state === "error" ? <XCircle className="size-4 text-destructive" /> : null}
              {file.state === "uploading" ? <ProBadge variant="pending">Uploading</ProBadge> : null}
            </div>

            {file.state === "uploading" ? (
              <div className="mt-2 h-1.5 rounded-full bg-muted">
                <div
                  className="h-1.5 rounded-full bg-primary transition-all"
                  style={{ width: `${Math.min(100, Math.max(0, file.progress ?? 0))}%` }}
                />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </ProPanel>
  )
}

export function ProOtpInput({
  value,
  onChange,
  length = 6,
}: {
  value: string
  onChange: (value: string) => void
  length?: number
}) {
  const chars = Array.from({ length }).map((_, idx) => value[idx] ?? "")

  return (
    <div className="flex items-center gap-2">
      {chars.map((char, idx) => (
        <input
          key={idx}
          value={char}
          inputMode="numeric"
          maxLength={1}
          onChange={(event) => {
            const digit = event.target.value.replace(/\D/g, "")
            const next = value.split("")
            next[idx] = digit
            onChange(next.join("").slice(0, length))
          }}
          className="size-11 rounded-xl border border-input/85 bg-surface-glass text-center text-base font-semibold shadow-[var(--shadow-xs)] outline-none transition focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/30"
        />
      ))}
    </div>
  )
}

export function ProValidationMessage({
  tone,
  message,
}: {
  tone: "success" | "error" | "info"
  message: string
}) {
  return (
    <p
      className={cn(
        "rounded-xl border px-3 py-2 text-xs",
        tone === "success" && "border-success/35 bg-success-soft text-success-foreground",
        tone === "error" && "border-destructive/35 bg-destructive-soft text-destructive",
        tone === "info" && "border-info/35 bg-info-soft text-info-foreground",
      )}
    >
      {message}
    </p>
  )
}

export function ProApprovalChecklist({
  items,
}: {
  items: Array<{ id: string; label: string; description?: string; checked: boolean }>
}) {
  return (
    <ProPanel className="space-y-2">
      {items.map((item) => (
        <label key={item.id} className="flex items-start gap-2 rounded-xl border border-border/60 bg-surface-glass p-2">
          <input className="mt-1 size-4 rounded border-primary/35 accent-[#5b62f2]" type="checkbox" checked={item.checked} readOnly />
          <span>
            <span className="block text-sm font-semibold text-foreground">{item.label}</span>
            {item.description ? <span className="block text-xs text-muted-foreground">{item.description}</span> : null}
          </span>
        </label>
      ))}
    </ProPanel>
  )
}

export function ProBookingPipeline({
  steps,
}: {
  steps: Array<{ label: string; date?: string; state: ProStepState }>
}) {
  return (
    <div className="space-y-3">
      {steps.map((step, index) => (
        <div key={`${step.label}-${index}`} className="flex gap-3">
          <div className="relative flex w-6 justify-center">
            {index < steps.length - 1 ? <span className="absolute top-6 h-8 w-px bg-border/70" /> : null}
            <span
              className={cn(
                "mt-1 size-5 rounded-full border",
                step.state === "completed" && "border-success/35 bg-success-soft",
                step.state === "active" && "border-primary/35 bg-primary/12",
                step.state === "error" && "border-destructive/35 bg-destructive-soft",
                step.state === "default" && "border-border/70 bg-surface-glass",
                step.state === "disabled" && "border-border/60 bg-muted",
              )}
            />
          </div>
          <div className={cn("flex-1 rounded-xl border border-border/70 bg-surface-glass px-3 py-2", step.state === "active" && "border-primary/35 bg-[#f4f0ff]")}>
            <p className="text-sm font-semibold text-foreground">{step.label}</p>
            {step.date ? <p className="text-xs text-muted-foreground">{step.date}</p> : null}
          </div>
        </div>
      ))}
    </div>
  )
}

export function ProSuccessConfirmation({
  title,
  description,
  primaryAction,
  secondaryAction,
}: {
  title: string
  description: string
  primaryAction?: React.ReactNode
  secondaryAction?: React.ReactNode
}) {
  return (
    <ProPanel className="flex flex-col items-center gap-4 py-8 text-center">
      <div className="grid size-14 place-content-center rounded-full bg-success-soft text-success">
        <CheckCircle2 className="size-7" />
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {primaryAction ?? <ProButton>View Details</ProButton>}
        {secondaryAction ?? <ProButton variant="outline">Back</ProButton>}
      </div>
    </ProPanel>
  )
}
