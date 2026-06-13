import Link from "next/link"

import { ProjectForm } from "@/components/admin/projects/project-form"
import { ProjectMediaManager } from "@/components/admin/projects/project-media-manager"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ROUTES } from "@/config/routes"
import {
  getAdminProjectById,
  getAdminProjectFormOptions,
  listAdminProjectMedia,
} from "@/lib/admin/projects/actions"

type AdminProjectEditPageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function AdminProjectEditPage({ params }: AdminProjectEditPageProps) {
  const { id } = await params

  const projectResult = await getAdminProjectById(id)

  if (!projectResult.ok) {
    return (
      <section className="internal-page max-w-4xl">
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

  const options = await getAdminProjectFormOptions()
  const mediaResult = await listAdminProjectMedia(id)

  return (
    <section className="internal-page">
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

      {mediaResult.ok ? (
        <ProjectMediaManager
          projectId={projectResult.project.id}
          mediaItems={mediaResult.items}
          fileOptions={options.featuredFiles}
          mediaTypeOptions={options.mediaTypes}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Project Media</CardTitle>
            <CardDescription>
              Media relation manager is temporarily unavailable for this project.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{mediaResult.message}</p>
          </CardContent>
        </Card>
      )}
    </section>
  )
}
