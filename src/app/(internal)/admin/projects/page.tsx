import Link from "next/link"

import { AdminProjectsTable } from "@/components/admin/projects/admin-projects-table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ROUTES } from "@/config/routes"
import {
  listAdminProjects,
  type PublishedFilter,
} from "@/lib/admin/projects/actions"

type ProjectsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
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

function parsePage(value: string): number {
  const parsed = Number.parseInt(value, 10)
  if (Number.isNaN(parsed) || parsed < 1) {
    return 1
  }

  return parsed
}

function buildProjectsQuery(params: {
  search: string
  status: string
  published: PublishedFilter
  category: string
  page: number
}): string {
  const query = new URLSearchParams()

  if (params.search) {
    query.set("q", params.search)
  }

  if (params.status !== "ALL") {
    query.set("status", params.status)
  }

  if (params.published !== "ALL") {
    query.set("published", params.published)
  }

  if (params.category !== "ALL") {
    query.set("category", params.category)
  }

  query.set("page", String(params.page))

  return query.toString()
}

export default async function AdminProjectsPage({ searchParams }: ProjectsPageProps) {
  const params = (await searchParams) ?? {}
  const search = getQueryValue(params.q).trim()
  const status = getQueryValue(params.status).trim()
  const published = getQueryValue(params.published).trim().toUpperCase() as PublishedFilter | ""
  const category = getQueryValue(params.category).trim()
  const page = parsePage(getQueryValue(params.page))

  const result = await listAdminProjects({
    search,
    status,
    published,
    category,
    page,
    pageSize: 20,
  })

  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize))
  const previousPage = Math.max(1, result.page - 1)
  const nextPage = Math.min(totalPages, result.page + 1)

  const previousHref = `${ROUTES.admin.projects}?${buildProjectsQuery({
    search: result.search,
    status: result.status,
    published: result.published,
    category: result.category,
    page: previousPage,
  })}`

  const nextHref = `${ROUTES.admin.projects}?${buildProjectsQuery({
    search: result.search,
    status: result.status,
    published: result.published,
    category: result.category,
    page: nextPage,
  })}`

  return (
    <section className="mx-auto w-full max-w-6xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Projects</CardTitle>
          <CardDescription>
            Manage property project records for internal operations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            action={ROUTES.admin.projects}
            className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_1fr_auto_auto]"
          >
            <Input
              name="q"
              defaultValue={result.search}
              placeholder="Search by project, slug, developer, region, or area"
            />
            <select
              name="status"
              defaultValue={result.status}
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
            >
              <option value="ALL">All statuses</option>
              {result.statusOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
            <select
              name="published"
              defaultValue={result.published}
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
            >
              <option value="ALL">All publish states</option>
              <option value="PUBLISHED">Published</option>
              <option value="UNPUBLISHED">Draft</option>
            </select>
            <select
              name="category"
              defaultValue={result.category}
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
            >
              <option value="ALL">All categories</option>
              {result.categoryOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
            <Button type="submit" variant="outline">
              Apply
            </Button>
            <Button asChild variant="ghost">
              <Link href={ROUTES.admin.projects}>Reset</Link>
            </Button>
          </form>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>
              Showing {result.projects.length} of {result.total} projects.
            </span>
            <Button asChild size="sm" variant="outline">
              <Link href={ROUTES.admin.projectsNew}>Create Project</Link>
            </Button>
          </div>

          <AdminProjectsTable projects={result.projects} />

          <div className="flex items-center justify-between border-t pt-3 text-sm text-muted-foreground">
            <span>
              Page {result.page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button asChild size="sm" variant="outline" disabled={result.page <= 1}>
                <Link href={previousHref}>Previous</Link>
              </Button>
              <Button asChild size="sm" variant="outline" disabled={result.page >= totalPages}>
                <Link href={nextHref}>Next</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
