import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-lg bg-linear-to-r from-muted via-muted/70 to-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
