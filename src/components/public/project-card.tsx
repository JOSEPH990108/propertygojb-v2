import Link from "next/link"
import Image from "next/image"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ROUTES } from "@/config/routes"
import { cn } from "@/lib/utils"
import type { PublicProjectListItem } from "@/lib/public/projects/actions"

type ProjectCardProps = {
  project: PublicProjectListItem
  className?: string
}

function formatCurrency(value: string | null): string | null {
  if (!value) {
    return null
  }

  const numeric = Number.parseFloat(value)
  if (!Number.isFinite(numeric)) {
    return null
  }

  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    maximumFractionDigits: 0,
  }).format(numeric)
}

function formatPriceRange(min: string | null, max: string | null): string {
  const minText = formatCurrency(min)
  const maxText = formatCurrency(max)

  if (minText && maxText) {
    return minText === maxText ? minText : `${minText} - ${maxText}`
  }

  if (minText) {
    return `From ${minText}`
  }

  if (maxText) {
    return `Up to ${maxText}`
  }

  return "Price on request"
}

function buildLocationLabel(project: PublicProjectListItem): string {
  if (project.areaName && project.regionName) {
    return `${project.areaName}, ${project.regionName}`
  }

  if (project.areaName) {
    return project.areaName
  }

  if (project.regionName) {
    return project.regionName
  }

  return "Location to be announced"
}

export function ProjectCard({ project, className }: ProjectCardProps) {
  const displayName = project.displayName ?? project.name
  const description = project.description?.trim() || "Project details will be shared upon inquiry."

  return (
    <Card className={cn("public-panel-subtle public-fade-up h-full border-0 bg-card/82", className)}>
      {project.featuredImageUrl ? (
        <div className="relative h-52 w-full overflow-hidden">
          <Image
            src={project.featuredImageUrl}
            alt={displayName}
            width={960}
            height={540}
            className="h-full w-full object-cover transition-transform duration-500 group-hover/card:scale-[1.03]"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-transparent" />
        </div>
      ) : (
        <div className="h-52 w-full bg-gradient-to-br from-slate-300/55 via-blue-200/35 to-amber-100/50" />
      )}

      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {project.projectStatusName ? <Badge variant="outline">{project.projectStatusName}</Badge> : null}
          {project.isHotDeal ? (
            <Badge className="bg-amber-200 text-amber-950 hover:bg-amber-200">Hot deal</Badge>
          ) : null}
        </div>

        <CardTitle className="public-heading text-xl">{displayName}</CardTitle>
        <CardDescription className="public-kicker text-[0.64rem] text-muted-foreground">
          {buildLocationLabel(project)}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">{description}</p>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl border border-border/70 bg-background/80 p-3">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Starting price</p>
            <p className="mt-1 font-medium text-foreground">
              {formatPriceRange(project.minStartingPrice, project.maxStartingPrice)}
            </p>
          </div>
          <div className="rounded-xl border border-border/70 bg-background/80 p-3">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Total units</p>
            <p className="mt-1 font-medium text-foreground">{project.totalUnits || "-"}</p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="justify-between">
        <span className="text-xs text-muted-foreground">
          {project.launchYear ? `Launch ${project.launchYear}` : "Launching soon"}
        </span>
        <Link
          href={ROUTES.public.projectDetails(project.slug)}
          className="rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80"
        >
          View details
        </Link>
      </CardFooter>
    </Card>
  )
}
