import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"

import { ProjectCard } from "@/components/public/project-card"
import { PublicBookViewingForm } from "@/components/public/public-book-viewing-form"
import { PublicInquiryForm } from "@/components/public/public-inquiry-form"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ROUTES } from "@/config/routes"
import { getPublicProjectBySlug } from "@/lib/public/projects/actions"

type ProjectDetailsPageProps = {
  params: Promise<{
    slug: string
  }>
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

export default async function ProjectDetailsPage({ params }: ProjectDetailsPageProps) {
  const { slug } = await params
  const project = await getPublicProjectBySlug(slug)

  if (!project) {
    notFound()
  }

  const displayName = project.displayName ?? project.name
  const projectPath = ROUTES.public.projectDetails(project.slug)
  const locationLabel = [project.areaName, project.regionName].filter(Boolean).join(", ")

  return (
    <section className="public-copy space-y-8">
      <div className="public-panel-subtle flex items-center justify-between gap-2 px-4 py-3 text-sm text-muted-foreground">
        <Link href={ROUTES.public.projects} className="font-medium text-primary hover:text-primary/80">
          Back to projects
        </Link>
        <Link href={ROUTES.public.bookViewing} className="font-medium text-primary hover:text-primary/80">
          Book viewing
        </Link>
      </div>

      <div className="public-panel public-fade-up relative grid gap-6 overflow-hidden p-5 md:p-6 lg:grid-cols-[1.25fr_0.75fr] lg:p-8">
        <div className="absolute -left-10 bottom-0 h-44 w-44 rounded-full bg-blue-300/15 blur-3xl" />
        <div className="absolute -right-10 top-0 h-52 w-52 rounded-full bg-amber-200/15 blur-3xl" />

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {project.projectStatusName ? <Badge variant="outline">{project.projectStatusName}</Badge> : null}
            {project.isHotDeal ? (
              <Badge className="bg-amber-200 text-amber-950 hover:bg-amber-200">Hot deal</Badge>
            ) : null}
          </div>

          <div>
            <h1 className="public-heading text-4xl leading-tight text-slate-900 md:text-5xl">{displayName}</h1>
            <p className="mt-2 text-sm uppercase tracking-[0.16em] text-muted-foreground">
              {locationLabel || "Location to be announced"}
            </p>
          </div>

          <p className="text-sm leading-7 text-muted-foreground">
            {project.description?.trim() ||
              "Request latest project details, layout availability, and booking guidance from our team."}
          </p>
        </div>

        <div className="public-panel-subtle space-y-3 p-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Starting price</p>
            <p className="public-heading text-3xl font-semibold text-slate-900">
              {formatPriceRange(project.minStartingPrice, project.maxStartingPrice)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border-border/70 bg-background/70 p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Total units</p>
              <p className="font-medium">{project.totalUnits || "-"}</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-background/70 p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Launch year</p>
              <p className="font-medium">{project.launchYear ?? "TBC"}</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-background/70 p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Booking fee</p>
              <p className="font-medium">{formatCurrency(project.bookingFee) ?? "On request"}</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-background/70 p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Foreigner eligible</p>
              <p className="font-medium">{project.isForeignerEligible ? "Yes" : "No"}</p>
            </div>
          </div>
        </div>
      </div>

      {project.featuredImageUrl ? (
        <div className="public-panel-subtle overflow-hidden">
          <Image
            src={project.featuredImageUrl}
            alt={displayName}
            width={1600}
            height={900}
            className="h-64 w-full object-cover md:h-80"
            unoptimized
          />
        </div>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="public-panel-subtle border-0 bg-card/84">
          <CardHeader>
            <CardTitle className="public-heading text-xl">Project overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground">
            <p>
              Developer: <span className="font-medium text-foreground">{project.developerName ?? "-"}</span>
            </p>
            <p>
              Category / type:{" "}
              <span className="font-medium text-foreground">
                {[project.propertyCategoryName, project.propertyTypeName].filter(Boolean).join(" / ") || "-"}
              </span>
            </p>
            <p>
              Tenure: <span className="font-medium text-foreground">{project.tenureTypeName ?? "-"}</span>
            </p>
            <p>
              Address: <span className="font-medium text-foreground">{project.address ?? "To be announced"}</span>
            </p>
          </CardContent>
        </Card>

        <Card className="public-panel-subtle border-0 bg-card/84">
          <CardHeader>
            <CardTitle className="public-heading text-xl">Operational details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground">
            <p>
              Booking fee (Bumi):{" "}
              <span className="font-medium text-foreground">
                {formatCurrency(project.bookingFeeBumi) ?? "Not specified"}
              </span>
            </p>
            <p>
              Maintenance fee / sqft:{" "}
              <span className="font-medium text-foreground">
                {formatCurrency(project.maintenanceFeePerSqft) ?? "Not specified"}
              </span>
            </p>
            <p>
              Sinking fund / sqft:{" "}
              <span className="font-medium text-foreground">
                {formatCurrency(project.sinkingFundPerSqft) ?? "Not specified"}
              </span>
            </p>
            <p>
              Land area (acres):{" "}
              <span className="font-medium text-foreground">{project.landAreaAcres ?? "Not specified"}</span>
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="public-heading text-3xl text-slate-900">Layout options</h2>
        {project.layouts.length === 0 ? (
          <p className="public-panel-subtle border-dashed p-4 text-sm text-muted-foreground">
            Layout information will be shared during inquiry follow-up.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {project.layouts.map((layout) => (
              <Card key={layout.id} size="sm" className="public-panel-subtle border-0 bg-card/84">
                <CardHeader>
                  <CardTitle className="public-heading text-base">{layout.name ?? layout.code}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm leading-6 text-muted-foreground">
                  <p>
                    {layout.bedrooms} bed • {layout.bathrooms} bath • {layout.studyRooms} study
                  </p>
                  <p>{layout.builtUpSqft} sqft</p>
                  <p>
                    {layout.hasBalcony ? "Balcony" : "No balcony"} • {layout.hasYard ? "Yard" : "No yard"}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {project.media.length > 0 ? (
        <section className="space-y-3">
          <h2 className="public-heading text-3xl text-slate-900">Gallery</h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {project.media.map((media) => (
              <div key={media.id} className="public-panel-subtle overflow-hidden">
                {media.fileUrl ? (
                  <Image
                    src={media.fileUrl}
                    alt={media.caption ?? displayName}
                    width={1200}
                    height={800}
                    className="h-44 w-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="h-44 w-full bg-gradient-to-br from-muted to-background" />
                )}
                <div className="p-3 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">{media.caption ?? "Project media"}</p>
                  {media.mediaTypeName ? <p>{media.mediaTypeName}</p> : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {project.nearbyPlaces.length > 0 ? (
        <section className="space-y-3">
          <h2 className="public-heading text-3xl text-slate-900">Nearby places</h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {project.nearbyPlaces.map((place) => (
              <div key={place.id} className="public-panel-subtle p-3 text-sm">
                <p className="font-medium">{place.name}</p>
                <p className="text-muted-foreground">{place.category}</p>
                <p className="text-muted-foreground">{place.distanceKm ? `${place.distanceKm} km` : "Distance TBC"}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="public-panel grid gap-6 p-5 md:p-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h2 className="public-heading text-3xl text-slate-900">Ask about this project</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            Submit your questions and preferred purchase timeline. Team will follow up with latest
            availability and pricing details.
          </p>
          <PublicInquiryForm
            projects={[]}
            defaultProjectId={project.id}
            nextPath={projectPath}
            submitLabel="Send project inquiry"
          />
        </div>

        <div className="space-y-3">
          <h2 className="public-heading text-3xl text-slate-900">Book a viewing slot</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            Request viewing date and time. Agent team will confirm schedule based on site operations.
          </p>
          <PublicBookViewingForm projects={[]} defaultProjectId={project.id} nextPath={projectPath} />
        </div>
      </section>

      {project.similarProjects.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="public-heading text-3xl text-slate-900">Similar projects</h2>
            <Link href={ROUTES.public.projects} className="text-sm font-medium text-primary hover:text-primary/80">
              Browse all
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {project.similarProjects.map((similarProject) => (
              <ProjectCard key={similarProject.id} project={similarProject} />
            ))}
          </div>
        </section>
      ) : null}
    </section>
  )
}
