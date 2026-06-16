"use client"

import * as React from "react"
import {
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Command,
  ChevronDown,
  House,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react"

import { Calendar } from "@/components/ui/calendar"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { ProButton } from "@/components/pro-ui/button"
import { ProInput } from "@/components/pro-ui/input"

export function ProModal({
  trigger,
  title,
  description,
  children,
  footer,
  open,
  onOpenChange,
}: {
  trigger: React.ReactNode
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg rounded-2xl bg-linear-to-br from-white/96 via-surface-glass-strong to-[#f0ebff]/88">
        <DialogHeader>
          <DialogTitle className="text-xl">{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <div>{children}</div>
        {footer ? <DialogFooter>{footer}</DialogFooter> : null}
      </DialogContent>
    </Dialog>
  )
}

export function ProConfirmModal({
  trigger,
  title,
  description,
  tone = "danger",
  loading,
}: {
  trigger: React.ReactNode
  title: string
  description: string
  tone?: "danger" | "success"
  loading?: boolean
}) {
  return (
    <ProModal
      trigger={trigger}
      title={title}
      description={description}
      footer={
        <>
          <ProButton variant="outline">Cancel</ProButton>
          <ProButton variant={tone === "danger" ? "danger" : "success"} loading={loading}>
            {tone === "danger" ? "Confirm Delete" : "Confirm"}
          </ProButton>
        </>
      }
    >
      <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-surface-glass p-3">
        <span
          className={cn(
            "grid size-10 place-content-center rounded-full",
            tone === "danger" ? "bg-destructive-soft text-destructive" : "bg-success-soft text-success",
          )}
        >
          {tone === "danger" ? <CircleAlert className="size-5" /> : <CheckCircle2 className="size-5" />}
        </span>
        <p className="text-sm text-muted-foreground">This action can impact listed records.</p>
      </div>
    </ProModal>
  )
}

export function ProDrawer({
  trigger,
  title,
  description,
  children,
  footer,
}: {
  trigger: React.ReactNode
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="right" className="w-[420px] bg-linear-to-br from-white/96 via-surface-glass-strong to-[#f0ebff]/88">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description ? <SheetDescription>{description}</SheetDescription> : null}
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4">{children}</div>
        {footer ? <SheetFooter>{footer}</SheetFooter> : null}
      </SheetContent>
    </Sheet>
  )
}

export function ProSideDrawer({
  trigger,
  state = "default",
}: {
  trigger: React.ReactNode
  state?: "default" | "loading" | "success"
}) {
  return (
    <ProDrawer
      trigger={trigger}
      title="Edit Project"
      description="Right-side panel workflow"
      footer={
        <>
          <ProButton variant="outline">Cancel</ProButton>
          <ProButton loading={state === "loading"} variant={state === "success" ? "success" : "primary"}>
            {state === "success" ? "Saved" : "Save"}
          </ProButton>
        </>
      }
    >
      <div className="space-y-3 py-3">
        <ProInput placeholder="Project title" />
        <ProInput placeholder="Developer" />
        <ProInput placeholder="Region" />
        <div
          className={cn(
            "rounded-xl border px-3 py-2 text-xs",
            state === "success"
              ? "border-success/35 bg-success-soft text-success-foreground"
              : "border-border/70 bg-surface-glass text-muted-foreground",
          )}
        >
          {state === "success" ? "Changes saved successfully" : "Fill fields and submit."}
        </div>
      </div>
    </ProDrawer>
  )
}

export function ProCommandPalette({
  open,
  onOpenChange,
  items,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: Array<{ group: string; label: string; shortcut?: string; icon?: LucideIcon }>
}) {
  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      className="max-w-xl rounded-2xl bg-linear-to-br from-white/96 via-surface-glass-strong to-[#f0ebff]/88"
    >
      <CommandInput placeholder="Search command..." />
      <CommandList>
        <CommandEmpty>No result found.</CommandEmpty>
        {Array.from(new Set(items.map((item) => item.group))).map((group) => (
          <CommandGroup key={group} heading={group}>
            {items
              .filter((item) => item.group === group)
              .map((item) => (
                <CommandItem key={`${group}-${item.label}`}>
                  <span className="grid size-6 place-content-center rounded-md border border-border/60 bg-surface-glass">
                    {item.icon ? <item.icon className="size-3.5" /> : <Command className="size-3.5" />}
                  </span>
                  <span>{item.label}</span>
                  {item.shortcut ? <CommandShortcut>{item.shortcut}</CommandShortcut> : null}
                </CommandItem>
              ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  )
}

export function ProCalendar({
  mode = "single",
  selected,
  onSelect,
  month,
  onMonthChange,
  disabled,
  className,
}: {
  mode?: "single" | "range"
  selected?: Date | { from?: Date; to?: Date }
  onSelect?: (value: Date | { from?: Date; to?: Date } | undefined) => void
  month?: Date
  onMonthChange?: (month: Date) => void
  disabled?: (date: Date) => boolean
  className?: string
}) {
  const selectedDate = selected instanceof Date ? selected : selected?.from
  const initialMonth = React.useMemo(
    () => new Date((month ?? selectedDate ?? new Date()).getFullYear(), (month ?? selectedDate ?? new Date()).getMonth(), 1),
    [month, selectedDate],
  )
  const isControlledMonth = typeof month !== "undefined"
  const [internalMonth, setInternalMonth] = React.useState<Date>(initialMonth)
  const displayMonth = isControlledMonth ? month : internalMonth

  const [isMonthPickerMode, setIsMonthPickerMode] = React.useState(false)
  const [isYearPickerMode, setIsYearPickerMode] = React.useState(false)
  const [monthModeSource, setMonthModeSource] = React.useState<"day" | "year">("day")
  const [pickerYear, setPickerYear] = React.useState(displayMonth.getFullYear())
  const [yearPageStart, setYearPageStart] = React.useState(Math.floor(displayMonth.getFullYear() / 12) * 12)

  const yearOptions = React.useMemo(
    () => Array.from({ length: 12 }, (_, idx) => yearPageStart + idx),
    [yearPageStart],
  )

  const monthOptions = React.useMemo(
    () => Array.from({ length: 12 }, (_, idx) => ({ idx, label: new Date(2000, idx, 1).toLocaleString("en-US", { month: "short" }) })),
    [],
  )

  const handleMonthChange = React.useCallback(
    (nextMonth: Date) => {
      if (!isControlledMonth) {
        setInternalMonth(nextMonth)
      }
      onMonthChange?.(nextMonth)
      setIsMonthPickerMode(false)
      setIsYearPickerMode(false)
    },
    [isControlledMonth, onMonthChange],
  )

  const clampDateToMonth = React.useCallback((baseDate: Date, targetMonth: Date) => {
    const maxDay = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0).getDate()
    const clampedDay = Math.min(baseDate.getDate(), maxDay)
    return new Date(targetMonth.getFullYear(), targetMonth.getMonth(), clampedDay)
  }, [])

  const applyMonthAndClose = React.useCallback(
    (targetMonth: Date) => {
      handleMonthChange(targetMonth)
      if (selectedDate && onSelect) {
        onSelect(clampDateToMonth(selectedDate, targetMonth) as Date | { from?: Date; to?: Date } | undefined)
      }
      setIsMonthPickerMode(false)
      setIsYearPickerMode(false)
    },
    [clampDateToMonth, handleMonthChange, onSelect, selectedDate],
  )

  const openMonthMode = React.useCallback(
    (source: "day" | "year") => {
      setPickerYear(displayMonth.getFullYear())
      setMonthModeSource(source)
      setIsMonthPickerMode(true)
      setIsYearPickerMode(false)
    },
    [displayMonth],
  )

  const openYearMode = React.useCallback(() => {
    setYearPageStart(Math.floor(displayMonth.getFullYear() / 12) * 12)
    setIsYearPickerMode(true)
    setIsMonthPickerMode(false)
  }, [displayMonth])

  return (
    <div className={cn("relative w-fit rounded-2xl border border-border/70 bg-surface-glass p-2 shadow-[var(--shadow-sm)]", className)}>
      {isYearPickerMode ? (
        <div className="w-[15.25rem] rounded-xl border border-border/70 bg-linear-to-br from-white/96 via-surface-glass-strong to-[#f0ebff]/88 p-2 shadow-[var(--shadow-sm)] ring-1 ring-white/55 backdrop-blur-md">
          <div className="mb-2 flex items-center justify-between px-1">
            <button
              type="button"
              onClick={() => setYearPageStart((current) => current - 12)}
              className="grid size-7 place-content-center rounded-md border border-border/65 bg-surface-glass text-muted-foreground transition hover:border-ring/35 hover:text-foreground"
              aria-label="Previous year range"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => openMonthMode("year")}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-foreground transition hover:bg-primary/10"
            >
              {yearOptions[0]} - {yearOptions[yearOptions.length - 1]}
              <ChevronDown className="size-4 text-muted-foreground" />
            </button>
            <button
              type="button"
              onClick={() => setYearPageStart((current) => current + 12)}
              className="grid size-7 place-content-center rounded-md border border-border/65 bg-surface-glass text-muted-foreground transition hover:border-ring/35 hover:text-foreground"
              aria-label="Next year range"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {yearOptions.map((yearOption) => {
              const isActive = displayMonth.getFullYear() === yearOption

              return (
                <button
                  key={yearOption}
                  type="button"
                  onClick={() => {
                    setPickerYear(yearOption)
                    handleMonthChange(new Date(yearOption, displayMonth.getMonth(), 1))
                    openMonthMode("year")
                  }}
                  className={cn(
                    "rounded-md border border-border/60 px-2 py-2 text-sm font-semibold text-foreground transition hover:border-primary/30 hover:bg-[#f1ebff]",
                    isActive && "border-primary/35 bg-primary/14 text-primary",
                  )}
                >
                  {yearOption}
                </button>
              )
            })}
          </div>
        </div>
      ) : isMonthPickerMode ? (
        <div className="w-[15.25rem] rounded-xl border border-border/70 bg-linear-to-br from-white/96 via-surface-glass-strong to-[#f0ebff]/88 p-2 shadow-[var(--shadow-sm)] ring-1 ring-white/55 backdrop-blur-md">
          <div className="mb-2 flex items-center justify-between px-1">
            <button
              type="button"
              onClick={() => setPickerYear((current) => current - 1)}
              className="grid size-7 place-content-center rounded-md border border-border/65 bg-surface-glass text-muted-foreground transition hover:border-ring/35 hover:text-foreground"
              aria-label="Previous year"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (monthModeSource === "day") {
                  openYearMode()
                  return
                }
                setIsMonthPickerMode(false)
                setIsYearPickerMode(false)
              }}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-foreground transition hover:bg-primary/10"
            >
              {pickerYear}
              <ChevronDown className="size-4 text-muted-foreground" />
            </button>
            <button
              type="button"
              onClick={() => setPickerYear((current) => current + 1)}
              className="grid size-7 place-content-center rounded-md border border-border/65 bg-surface-glass text-muted-foreground transition hover:border-ring/35 hover:text-foreground"
              aria-label="Next year"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {monthOptions.map((monthOption) => {
              const isActive = displayMonth.getFullYear() === pickerYear && displayMonth.getMonth() === monthOption.idx

              return (
                <button
                  key={monthOption.idx}
                  type="button"
                  onClick={() => applyMonthAndClose(new Date(pickerYear, monthOption.idx, 1))}
                  className={cn(
                    "rounded-md border border-border/60 px-2 py-2 text-xs font-semibold text-foreground transition hover:border-primary/30 hover:bg-[#f1ebff]",
                    isActive && "border-primary/35 bg-primary/14 text-primary",
                  )}
                >
                  {monthOption.label}
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        <Calendar
          mode={mode as never}
          selected={selected as never}
          onSelect={onSelect as never}
          month={displayMonth}
          onMonthChange={handleMonthChange}
          disabled={disabled}
          className="rounded-xl"
          classNames={{
            day_button: "data-[selected-single=true]:bg-primary data-[selected-single=true]:text-white hover:bg-primary/12",
            range_middle: "bg-primary/10",
          }}
          components={{
            CaptionLabel: ({ className: captionClassName, children, ...captionProps }) => (
              <button
                type="button"
                className={cn(
                  "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-foreground transition hover:bg-primary/10",
                  captionClassName,
                )}
                onClick={() => {
                  openMonthMode("day")
                }}
                {...captionProps}
              >
                <span>{children}</span>
                <ChevronDown className="size-4 text-muted-foreground" />
              </button>
            ),
          }}
        />
      )}
    </div>
  )
}

export function ProDatePicker({
  value,
  onChange,
  tone = "default",
  disabled,
}: {
  value?: Date
  onChange?: (date: Date | undefined) => void
  tone?: "default" | "error"
  disabled?: (date: Date) => boolean
}) {
  const [open, setOpen] = React.useState(false)
  const [viewMonth, setViewMonth] = React.useState<Date>(value ?? new Date())

  return (
    <div className="space-y-2">
      <ProButton
        variant="outline"
        className={cn("w-full justify-between", tone === "error" && "border-destructive/60")}
        onClick={() => {
          setOpen((prev) => {
            const next = !prev
            if (next) {
              setViewMonth(new Date((value ?? new Date()).getFullYear(), (value ?? new Date()).getMonth(), 1))
            }
            return next
          })
        }}
      >
        <span className="inline-flex items-center gap-2">
          <CalendarDays className="size-4" />
          {value ? value.toDateString() : "Pick a date"}
        </span>
      </ProButton>
      {open ? (
        <ProCalendar
          className="border-0 bg-transparent p-0 shadow-none"
          selected={value}
          month={viewMonth}
          onMonthChange={setViewMonth}
          onSelect={(date) => {
            onChange?.(date as Date | undefined)
            setOpen(false)
          }}
          disabled={disabled}
        />
      ) : null}
      {tone === "error" ? <p className="text-xs text-destructive">Date is required.</p> : null}
    </div>
  )
}

export function ProCarouselCard({
  image,
  title,
  subtitle,
  cta,
}: {
  image: string
  title: string
  subtitle: string
  cta: string
}) {
  return (
    <article className="relative h-56 overflow-hidden rounded-2xl border border-border/75 bg-surface-glass">
      <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${image})` }} aria-label={title} role="img" />
      <div className="absolute inset-0 bg-linear-to-t from-slate-950/75 via-slate-900/35 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 space-y-2 p-4 text-white">
        <p className="text-lg font-semibold">{title}</p>
        <p className="text-xs text-slate-200">{subtitle}</p>
        <ProButton size="sm" variant="gradient">{cta}</ProButton>
      </div>
    </article>
  )
}

export function ProCarousel({
  slides,
}: {
  slides: Array<{ image: string; title: string; subtitle: string; cta: string }>
}) {
  const [index, setIndex] = React.useState(0)
  const active = slides[index]

  return (
    <div className="space-y-3">
      <ProCarouselCard {...active} />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ProButton size="icon" variant="outline" onClick={() => setIndex((prev) => (prev - 1 + slides.length) % slides.length)}>
            <ChevronLeft className="size-4" />
          </ProButton>
          <ProButton size="icon" variant="outline" onClick={() => setIndex((prev) => (prev + 1) % slides.length)}>
            <ChevronRight className="size-4" />
          </ProButton>
        </div>
        <div className="flex gap-1.5">
          {slides.map((slide, slideIndex) => (
            <button
              type="button"
              aria-label={slide.title}
              key={slide.title}
              onClick={() => setIndex(slideIndex)}
              className={cn("h-2 w-2 rounded-full bg-muted transition", slideIndex === index && "w-6 bg-primary")}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export function ProCommandPreviewRow({
  title,
  shortcut,
  selected,
}: {
  title: string
  shortcut: string
  selected?: boolean
}) {
  return (
    <div className={cn("flex items-center gap-2 rounded-lg border border-border/60 bg-surface-glass px-2.5 py-2", selected && "bg-primary/12")}>
      <span className="grid size-6 place-content-center rounded-md border border-border/60 bg-white/80">
        <House className="size-3.5" />
      </span>
      <span className="flex-1 text-sm">{title}</span>
      <span className="rounded-md border border-border/70 px-1.5 py-0.5 text-[11px] text-muted-foreground">{shortcut}</span>
    </div>
  )
}
