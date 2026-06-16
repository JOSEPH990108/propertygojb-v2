import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-20 w-full rounded-xl border border-input/85 bg-surface-glass px-3 py-2 text-base shadow-[var(--shadow-xs)] backdrop-blur-sm transition-[background-color,border-color,box-shadow,color] duration-200 outline-none placeholder:text-muted-foreground/90 hover:border-ring/30 hover:bg-background/90 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:bg-input/45 disabled:opacity-55 data-[valid=true]:border-success/65 data-[valid=true]:bg-success-soft/40 data-[valid=true]:focus-visible:ring-success/25 aria-invalid:border-destructive/65 aria-invalid:bg-destructive-soft/35 aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
