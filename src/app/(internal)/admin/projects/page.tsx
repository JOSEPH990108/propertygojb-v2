import Link from "next/link"

import { AdminProjectsTable } from "@/components/admin/projects/admin-projects-table"
import {
  ActionCard,
  ProButton,
  ProSearchInput,
  ProSelect,
  ProTableFilter,
  ProTablePagination,
  ProTableToolbar,
} from "@/components/pro-ui"
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
    <section className="internal-page">
      <ActionCard
        title="Projects"
        description="Manage property project records for internal operations."
        action={
          <ProButton asChild variant="gradient" size="sm">
            <Link href={ROUTES.admin.projectsNew}>Create Project</Link>
          </ProButton>
        }
      >
        <div className="space-y-4">
          <form
            action={ROUTES.admin.projects}
            className="grid gap-3 lg:grid-cols-[2fr_1fr_1fr_1fr_auto_auto]"
          >
            <ProSearchInput
              name="q"
              defaultValue={result.search}
              placeholder="Search by project, slug, developer, region, or area"
            />
            <ProTableFilter as="div" showIcon={false} className="p-0">
              <ProSelect
                name="status"
                defaultValue={result.status}
                options={[
                  { value: "ALL", label: "All statuses" },
                  ...result.statusOptions.map((option) => ({ value: option.id, label: option.name })),
                ]}
              />
            </ProTableFilter>
            <ProTableFilter as="div" showIcon={false} className="p-0">
              <ProSelect
                name="published"
                defaultValue={result.published}
                options={[
                  { value: "ALL", label: "All publish states" },
                  { value: "PUBLISHED", label: "Published" },
                  { value: "UNPUBLISHED", label: "Draft" },
                ]}
              />
            </ProTableFilter>
            <ProTableFilter as="div" showIcon={false} className="p-0">
              <ProSelect
                name="category"
                defaultValue={result.category}
                options={[
                  { value: "ALL", label: "All categories" },
                  ...result.categoryOptions.map((option) => ({ value: option.id, label: option.name })),
                ]}
              />
            </ProTableFilter>
            <ProButton type="submit" variant="primary">
              Apply
            </ProButton>
            <ProButton asChild variant="ghost">
              <Link href={ROUTES.admin.projects}>Reset</Link>
            </ProButton>
          </form>

          <ProTableToolbar>
            <p className="text-xs text-muted-foreground">
              Showing {result.projects.length} of {result.total} projects.
            </p>
          </ProTableToolbar>

          <AdminProjectsTable projects={result.projects} />

          <ProTablePagination
            page={result.page}
            totalPages={totalPages}
            previousHref={previousHref}
            nextHref={nextHref}
          />
        </div>
      </ActionCard>
    </section>
  )
}
