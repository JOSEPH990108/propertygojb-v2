import Link from "next/link"

import { ProjectForm } from "@/components/admin/projects/project-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ROUTES } from "@/config/routes"
import {
  getAdminProjectById,
  getAdminProjectFormOptions,
} from "@/lib/admin/projects/actions"

type AdminProjectEditPageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function AdminProjectEditPage({ params }: AdminProjectEditPageProps) {
  const { id } = await params

  const [projectResult, options] = await Promise.all([
    getAdminProjectById(id),
    getAdminProjectFormOptions(),
  ])

  if (!projectResult.ok) {
    return (
      <section className="mx-auto w-full max-w-4xl space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Edit Project</CardTitle>
            <CardDescription>
              The requested project record is unavailable.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {projectResult.message}
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href={ROUTES.admin.projects}>Back to Projects</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    )
  }

  return (
    <section className="mx-auto w-full max-w-6xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Edit Project</CardTitle>
          <CardDescription>
            Update project fields while preserving validation and lookup safety.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" size="sm">
            <Link href={ROUTES.admin.projects}>Back to Projects</Link>
          </Button>
        </CardContent>
      </Card>

      <ProjectForm mode="edit" options={options} project={projectResult.project} />
    </section>
  )
}
