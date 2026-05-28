import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type PagePlaceholderProps = {
  title: string
  description: string
  eyebrow?: string
  className?: string
  children?: React.ReactNode
}

export function PagePlaceholder({
  title,
  description,
  eyebrow,
  className,
  children,
}: PagePlaceholderProps) {
  return (
    <section className={cn("mx-auto w-full max-w-5xl", className)}>
      <Card className="border-border/70 shadow-sm">
        <CardHeader className="space-y-3">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {eyebrow}
            </p>
          ) : null}
          <CardTitle className="text-2xl md:text-3xl">{title}</CardTitle>
          <CardDescription className="max-w-2xl text-base">
            {description}
          </CardDescription>
        </CardHeader>
        {children ? <CardContent>{children}</CardContent> : null}
      </Card>
    </section>
  )
}
