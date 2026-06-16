"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const proButtonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition-all duration-200 outline-none focus-visible:ring-4 focus-visible:ring-ring/35 active:translate-y-px active:shadow-[var(--shadow-xs)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "border-primary/30 bg-linear-to-r from-[#5f66f5] via-[#5a63f1] to-[#4f6ff4] text-primary-foreground shadow-[var(--shadow-sm)] hover:brightness-105",
        secondary:
          "border-border/70 bg-[#f4f3ff] text-secondary-foreground shadow-[var(--shadow-xs)] hover:bg-[#ece9ff]",
        success:
          "border-success/35 bg-success-soft text-success-foreground shadow-[var(--shadow-xs)] hover:bg-success-soft/80",
        danger:
          "border-destructive/35 bg-destructive-soft text-destructive shadow-[var(--shadow-xs)] hover:bg-destructive-soft/80",
        ghost:
          "border-transparent bg-transparent text-foreground hover:bg-accent/75 hover:text-accent-foreground",
        outline:
          "border-border/75 bg-surface-glass text-foreground shadow-[var(--shadow-xs)] backdrop-blur-sm hover:border-ring/35 hover:bg-[#f5f3ff]",
        soft: "border-primary/20 bg-primary/12 text-primary hover:bg-primary/18",
        gradient:
          "border-transparent bg-linear-to-r from-[#3f68f0] via-[#5e61f3] to-[#7e56f2] text-white shadow-[var(--shadow-md)] hover:brightness-110",
      },
      size: {
        sm: "min-h-9 rounded-lg px-3 text-xs",
        md: "min-h-11 px-4",
        lg: "min-h-12 rounded-2xl px-5 text-base",
        icon: "size-11 rounded-xl p-0",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      fullWidth: false,
    },
  },
)

export type ProButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof proButtonVariants> & {
    leftIcon?: React.ReactNode
    rightIcon?: React.ReactNode
    loading?: boolean
    asChild?: boolean
  }

export function ProButton({
  className,
  variant,
  size,
  fullWidth,
  leftIcon,
  rightIcon,
  loading,
  asChild = false,
  disabled,
  children,
  ...props
}: ProButtonProps) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      className={cn(proButtonVariants({ variant, size, fullWidth }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : leftIcon}
      <Slot.Slottable>
        <span>{children}</span>
      </Slot.Slottable>
      {!loading ? rightIcon : null}
    </Comp>
  )
}

export { proButtonVariants }
