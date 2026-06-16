import Link from "next/link"

import { AdminPropertiesTable } from "@/components/admin/properties/admin-properties-table"
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
import { listAdminProperties } from "@/lib/admin/properties/actions"

type PropertiesPageProps = {
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

function buildPropertiesQuery(params: {
  search: string
  projectId: string | "ALL"
  bookingStatusId: string | "ALL"
  page: number
}): string {
  const query = new URLSearchParams()

  if (params.search) {
    query.set("q", params.search)
  }

  if (params.projectId !== "ALL") {
    query.set("projectId", params.projectId)
  }

  if (params.bookingStatusId !== "ALL") {
    query.set("bookingStatusId", params.bookingStatusId)
  }

  query.set("page", String(params.page))

  return query.toString()
}

export default async function AdminPropertiesPage({ searchParams }: PropertiesPageProps) {
  const params = (await searchParams) ?? {}
  const search = getQueryValue(params.q).trim()
  const projectId = getQueryValue(params.projectId).trim()
  const bookingStatusId = getQueryValue(params.bookingStatusId).trim()
  const page = parsePage(getQueryValue(params.page))

  const result = await listAdminProperties({
    search,
    projectId,
    bookingStatusId,
    page,
    pageSize: 20,
  })

  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize))
  const previousPage = Math.max(1, result.page - 1)
  const nextPage = Math.min(totalPages, result.page + 1)

  const previousHref = `${ROUTES.admin.properties}?${buildPropertiesQuery({
    search: result.search,
    projectId: result.projectId,
    bookingStatusId: result.bookingStatusId,
    page: previousPage,
  })}`

  const nextHref = `${ROUTES.admin.properties}?${buildPropertiesQuery({
    search: result.search,
    projectId: result.projectId,
    bookingStatusId: result.bookingStatusId,
    page: nextPage,
  })}`

  return (
    <section className="internal-page">
      <ActionCard title="Properties" description="Inventory visibility for projects, booking status, and pricing baselines.">
        <div className="space-y-4">
          <form action={ROUTES.admin.properties}>
            <ProTableToolbar className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_auto_auto]">
              <ProSearchInput
                name="q"
                defaultValue={result.search}
                placeholder="Search by unit no, project, status, lot type, layout, phase, or tower"
              />
              <ProTableFilter as="div" className="min-h-11 p-0" showIcon={false}>
                <ProSelect
                  name="projectId"
                  defaultValue={result.projectId}
                  options={[
                    { value: "ALL", label: "All projects" },
                    ...result.projectOptions.map((option) => ({ value: option.id, label: option.name })),
                  ]}
                />
              </ProTableFilter>
              <ProTableFilter as="div" className="min-h-11 p-0" showIcon={false}>
                <ProSelect
                  name="bookingStatusId"
                  defaultValue={result.bookingStatusId}
                  options={[
                    { value: "ALL", label: "All booking statuses" },
                    ...result.bookingStatusOptions.map((option) => ({ value: option.id, label: option.name })),
                  ]}
                />
              </ProTableFilter>
              <ProButton type="submit" variant="outline">
                Apply
              </ProButton>
              <ProButton asChild variant="ghost">
                <Link href={ROUTES.admin.properties}>Reset</Link>
              </ProButton>
            </ProTableToolbar>
          </form>

          <div className="text-xs text-muted-foreground">
            Showing {result.properties.length} of {result.total} properties.
          </div>

          <AdminPropertiesTable properties={result.properties} />

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
