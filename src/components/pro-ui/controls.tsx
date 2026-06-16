"use client"

import * as React from "react"
import { type LucideIcon } from "lucide-react"

import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

export function ProCheckbox({
  checked,
  onCheckedChange,
  disabled,
  indeterminate,
  label,
  description,
  className,
}: {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  indeterminate?: boolean
  label: string
  description?: string
  className?: string
}) {
  return (
    <label className={cn("flex items-start gap-2.5", disabled && "opacity-55", className)}>
      <Checkbox
        checked={indeterminate ? "indeterminate" : checked}
        disabled={disabled}
        onCheckedChange={(value) => onCheckedChange?.(value === true)}
        className="size-4.5 rounded-md"
      />
      <span className="space-y-0.5">
        <span className="block text-sm font-medium text-foreground">{label}</span>
        {description ? <span className="block text-xs text-muted-foreground">{description}</span> : null}
      </span>
    </label>
  )
}

export function ProRadioGroup({
  value,
  onValueChange,
  children,
  className,
}: {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  className?: string
}) {
  return (
    <RadioGroup value={value} onValueChange={onValueChange} className={cn("gap-2", className)}>
      {children}
    </RadioGroup>
  )
}

export function ProRadioItem({
  value,
  label,
  disabled,
  className,
}: {
  value: string
  label: string
  disabled?: boolean
  className?: string
}) {
  return (
    <label className={cn("flex items-center gap-2.5", disabled && "opacity-55", className)}>
      <RadioGroupItem value={value} disabled={disabled} className="size-4.5" />
      <span className="text-sm font-medium text-foreground">{label}</span>
    </label>
  )
}

export function ProSwitch({
  checked,
  onCheckedChange,
  disabled,
  label,
  className,
}: {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  label?: string
  className?: string
}) {
  return (
    <label className={cn("flex items-center gap-2.5", disabled && "opacity-55", className)}>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} className="h-6 w-11" />
      {label ? <span className="text-sm font-medium text-foreground">{label}</span> : null}
    </label>
  )
}

export function ProTabs({
  defaultValue,
  children,
  className,
}: {
  defaultValue: string
  children: React.ReactNode
  className?: string
}) {
  return <Tabs defaultValue={defaultValue} className={className}>{children}</Tabs>
}

export function ProTabList({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode
  variant?: "default" | "line"
  className?: string
}) {
  return <TabsList variant={variant} className={className}>{children}</TabsList>
}

export function ProTab({
  value,
  label,
  icon: Icon,
  disabled,
  className,
}: {
  value: string
  label: string
  icon?: LucideIcon
  disabled?: boolean
  className?: string
}) {
  return (
    <TabsTrigger value={value} disabled={disabled} className={cn("data-active:bg-primary/12 data-active:text-primary", className)}>
      {Icon ? <Icon className="size-4" /> : null}
      {label}
    </TabsTrigger>
  )
}

export function ProTabPanel({
  value,
  children,
  className,
}: {
  value: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <TabsContent value={value} className={cn("rounded-xl border border-border/70 bg-surface-glass p-3", className)}>
      {children}
    </TabsContent>
  )
}
