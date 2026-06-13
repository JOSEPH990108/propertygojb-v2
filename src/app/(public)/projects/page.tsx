import Link from "next/link"

import { ProjectCard } from "@/components/public/project-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ROUTES } from "@/config/routes"
import { listPublicProjects } from "@/lib/public/projects/actions"

type ProjectsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

type ProjectsQueryState = {
  search: string
  propertyCategoryId: string
  projectStatusId: string
  regionId: string
  page: number
}

function getQueryValue(value: string | string[] | undefined): string {
  if (typeof value === "string") {
    return value
  }

  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0]
  }

  return ""
}

function parsePositivePage(value: string): number {
  const parsed = Number.parseInt(value, 10)
  if (Number.isNaN(parsed) || parsed < 1) {
    return 1
  }

  return parsed
}

function buildProjectsQuery(state: ProjectsQueryState): string {
  const query = new URLSearchParams()

  if (state.search) {
    query.set("q", state.search)
  }

  if (state.propertyCategoryId) {
    query.set("category", state.propertyCategoryId)
  }

  if (state.projectStatusId) {
    query.set("status", state.projectStatusId)
  }

  if (state.regionId) {
    query.set("region", state.regionId)
  }

  query.set("page", String(state.page))

  return query.toString()
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const params = (await searchParams) ?? {}

  const queryState: ProjectsQueryState = {
    search: getQueryValue(params.q).trim(),
    propertyCategoryId: getQueryValue(params.category).trim(),
    projectStatusId: getQueryValue(params.status).trim(),
    regionId: getQueryValue(params.region).trim(),
    page: parsePositivePage(getQueryValue(params.page)),
  }

  const result = await listPublicProjects({
    search: queryState.search,
    propertyCategoryId: queryState.propertyCategoryId,
    projectStatusId: queryState.projectStatusId,
    regionId: queryState.regionId,
    page: queryState.page,
    pageSize: 9,
  })

  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize))
  const previousHref = `${ROUTES.public.projects}?${buildProjectsQuery({
    ...result.filters,
    search: result.search,
    page: Math.max(1, result.page - 1),
  })}`
  const nextHref = `${ROUTES.public.projects}?${buildProjectsQuery({
    ...result.filters,
    search: result.search,
    page: Math.min(totalPages, result.page + 1),
  })}`

  return (
    <section className="public-copy space-y-8">
      <div className="space-y-2">
        <p className="public-kicker">
          Public directory
        </p>
        <h1 className="public-heading text-4xl text-slate-900 md:text-5xl">Published projects</h1>
        <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
          Filter by location, status, and project category. Inquiry actions are available on each
          project detail page.
        </p>
      </div>

      <form
        action={ROUTES.public.projects}
        className="public-panel public-fade-up grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_1fr_auto_auto]"
      >
        <Input
          name="q"
          defaultValue={result.search}
          placeholder="Search by project or location"
          className="h-10 rounded-xl bg-background/85"
        />

        <select
          name="category"
          defaultValue={result.filters.propertyCategoryId}
          className="public-form-select"
        >
          <option value="">All categories</option>
          {result.options.categories.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>

        <select
          name="status"
          defaultValue={result.filters.projectStatusId}
          className="public-form-select"
        >
          <option value="">All statuses</option>
          {result.options.statuses.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>

        <select
          name="region"
          defaultValue={result.filters.regionId}
          className="public-form-select"
        >
          <option value="">All regions</option>
          {result.options.regions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>

        <Button
          type="submit"
          className="h-10 rounded-xl bg-[color:var(--public-accent-strong)] px-4 text-white hover:bg-[color:var(--public-accent-soft)]"
        >
          Apply
        </Button>
        <Button asChild variant="outline" className="h-10 rounded-xl bg-background/85">
          <Link href={ROUTES.public.projects}>Reset filters</Link>
        </Button>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <p>
          Showing {result.items.length} of {result.total} published projects.
        </p>
        <Link href={ROUTES.public.contact} className="font-medium text-primary hover:text-primary/80">
          Need curated recommendations?
        </Link>
      </div>

      {result.items.length === 0 ? (
        <div className="public-panel-subtle border-dashed p-6 text-sm text-muted-foreground">
          No projects match current filters. Reset filters or send inquiry and our team can suggest
          alternatives.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {result.items.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      <div className="public-panel-subtle flex items-center justify-between px-4 py-3 text-sm text-muted-foreground">
        <span>
          Page {result.page} of {totalPages}
        </span>
        <div className="flex items-center gap-2">
          {result.page > 1 ? (
            <Button asChild size="sm" variant="outline">
              <Link href={previousHref}>Previous</Link>
            </Button>
          ) : (
            <Button size="sm" variant="outline" disabled>
              Previous
            </Button>
          )}

          {result.page < totalPages ? (
            <Button asChild size="sm" variant="outline">
              <Link href={nextHref}>Next</Link>
            </Button>
          ) : (
            <Button size="sm" variant="outline" disabled>
              Next
            </Button>
          )}
        </div>
      </div>
    </section>
  )
}
