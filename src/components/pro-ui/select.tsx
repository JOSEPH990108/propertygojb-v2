"use client"

import * as React from "react"
import { Check, ChevronDown } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

type ProSelectOption = {
  value: string
  label: string
  disabled?: boolean
}

const PRO_SELECT_EMPTY_SENTINEL = "__PRO_SELECT_EMPTY__"

export function ProSelect({
  options,
  placeholder = "Select option",
  name,
  value,
  defaultValue,
  onValueChange,
  disabled,
  tone = "default",
  emptyOptionLabel,
  className,
  triggerClassName,
  contentClassName,
}: {
  options: ProSelectOption[]
  placeholder?: string
  name?: string
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  tone?: "default" | "error" | "success"
  emptyOptionLabel?: string
  className?: string
  triggerClassName?: string
  contentClassName?: string
}) {
  const isControlled = typeof value !== "undefined"
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? "")
  const selectedValue = isControlled ? value : internalValue

  function handleValueChange(nextValue: string) {
    const mappedValue = nextValue === PRO_SELECT_EMPTY_SENTINEL ? "" : nextValue

    if (!isControlled) {
      setInternalValue(mappedValue)
    }

    onValueChange?.(mappedValue)
  }

  return (
    <div className={className}>
      {name ? <input type="hidden" name={name} value={selectedValue ?? ""} /> : null}

      <Select
        value={selectedValue ? selectedValue : undefined}
        onValueChange={handleValueChange}
        disabled={disabled}
      >
        <SelectTrigger
          className={cn(
            "w-full rounded-xl border border-border/75 bg-surface-glass shadow-[var(--shadow-xs)] focus-visible:ring-4 focus-visible:ring-ring/35",
            tone === "error" && "border-destructive/60 bg-destructive-soft/45 focus-visible:ring-destructive/20",
            tone === "success" && "border-success/55 bg-success-soft/45 focus-visible:ring-success/20",
            triggerClassName,
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent
          position="popper"
          sideOffset={8}
          collisionPadding={10}
          align="start"
          className={cn("rounded-xl border border-border/75 bg-surface-glass-strong p-1 shadow-[var(--shadow-md)] ring-1 ring-white/55", contentClassName)}
        >
          {emptyOptionLabel ? (
            <SelectItem value={PRO_SELECT_EMPTY_SENTINEL}>
              {emptyOptionLabel}
            </SelectItem>
          ) : null}

          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              className="data-[state=checked]:bg-primary/12 data-[state=checked]:text-primary"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

type ProDropdownContextValue = {
  value?: string
  onSelect?: (value: string) => void
}

const ProDropdownContext = React.createContext<ProDropdownContextValue>({})

export function ProDropdown({
  trigger,
  children,
  className,
  contentClassName,
  value,
  onSelect,
}: {
  trigger: React.ReactNode
  children: React.ReactNode
  className?: string
  contentClassName?: string
  value?: string
  onSelect?: (value: string) => void
}) {
  return (
    <ProDropdownContext.Provider value={{ value, onSelect }}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex min-h-11 items-center gap-2 rounded-xl border border-border/75 bg-surface-glass px-3 text-sm shadow-[var(--shadow-xs)] outline-none transition hover:border-ring/35 focus-visible:ring-4 focus-visible:ring-ring/35",
              className,
            )}
          >
            {trigger}
            <ChevronDown className="size-4 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          sideOffset={8}
          collisionPadding={10}
          className={cn("min-w-52 rounded-xl border border-border/75 bg-surface-glass-strong p-1 shadow-[var(--shadow-md)] ring-1 ring-white/55", contentClassName)}
        >
          {children}
        </DropdownMenuContent>
      </DropdownMenu>
    </ProDropdownContext.Provider>
  )
}

export function ProDropdownItem({
  value,
  label,
  icon,
  shortcut,
  destructive,
  disabled,
  className,
}: {
  value: string
  label: string
  icon?: React.ReactNode
  shortcut?: string
  destructive?: boolean
  disabled?: boolean
  className?: string
}) {
  const ctx = React.useContext(ProDropdownContext)
  const selected = ctx.value === value

  return (
    <DropdownMenuItem
      disabled={disabled}
      onClick={() => ctx.onSelect?.(value)}
      className={cn(
        "flex items-center gap-2 rounded-lg px-2 py-2 text-sm",
        selected && "bg-primary/12 text-primary",
        destructive && "text-destructive focus:bg-destructive-soft/70",
        className,
      )}
    >
      <span className="grid size-5 place-content-center rounded-md border border-border/60 bg-surface-glass text-muted-foreground">
        {icon ?? <Check className="size-3.5 opacity-0" />}
      </span>
      <span className="flex-1">{label}</span>
      {shortcut ? <span className="text-xs text-muted-foreground">{shortcut}</span> : null}
      {selected ? <Check className="size-4" /> : null}
    </DropdownMenuItem>
  )
}
