import Link from "next/link"

import { AdminPropertiesTable } from "@/components/admin/properties/admin-properties-table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
      <Card>
        <CardHeader>
          <CardTitle>Properties</CardTitle>
          <CardDescription>
            Inventory visibility for projects, booking status, and pricing baselines.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            action={ROUTES.admin.properties}
            className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_auto_auto]"
          >
            <Input
              name="q"
              defaultValue={result.search}
              placeholder="Search by unit no, project, status, lot type, layout, phase, or tower"
            />
            <select
              name="projectId"
              defaultValue={result.projectId}
              className="internal-form-select"
            >
              <option value="ALL">All projects</option>
              {result.projectOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
            <select
              name="bookingStatusId"
              defaultValue={result.bookingStatusId}
              className="internal-form-select"
            >
              <option value="ALL">All booking statuses</option>
              {result.bookingStatusOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
            <Button type="submit" variant="outline">
              Apply
            </Button>
            <Button asChild variant="ghost">
              <Link href={ROUTES.admin.properties}>Reset</Link>
            </Button>
          </form>

          <div className="text-xs text-muted-foreground">
            Showing {result.properties.length} of {result.total} properties.
          </div>

          <AdminPropertiesTable properties={result.properties} />

          <div className="internal-divider flex items-center justify-between text-sm text-muted-foreground">
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
