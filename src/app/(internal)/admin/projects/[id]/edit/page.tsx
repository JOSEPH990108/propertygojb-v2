import Link from "next/link"

import { ProjectForm } from "@/components/admin/projects/project-form"
import { ProjectMediaManager } from "@/components/admin/projects/project-media-manager"
import { ActionCard, ProButton, ProPanel, ProStatusBadge } from "@/components/pro-ui"
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
        <ActionCard
          title="Edit Project"
          description="The requested project record is unavailable."
        >
          <div className="space-y-3">
            <ProStatusBadge label="Unavailable" status="warning" />
            <p className="text-sm text-muted-foreground">
              {projectResult.message}
            </p>
            <ProButton asChild variant="outline" size="sm">
              <Link href={ROUTES.admin.projects}>Back to Projects</Link>
            </ProButton>
          </div>
        </ActionCard>
      </section>
    )
  }

  const options = await getAdminProjectFormOptions()
  const mediaResult = await listAdminProjectMedia(id)

  return (
    <section className="internal-page">
      <ActionCard
        title="Edit Project"
        description="Update project fields while preserving validation and lookup safety."
      >
        <div className="flex flex-wrap items-center gap-2">
          <ProStatusBadge label={projectResult.project.isPublished ? "Published" : "Draft"} status={projectResult.project.isPublished ? "published" : "draft"} />
          <ProButton asChild variant="outline" size="sm">
            <Link href={ROUTES.admin.projects}>Back to Projects</Link>
          </ProButton>
        </div>
      </ActionCard>

      <ProjectForm mode="edit" options={options} project={projectResult.project} />

      {mediaResult.ok ? (
        <ProjectMediaManager
          projectId={projectResult.project.id}
          mediaItems={mediaResult.items}
          fileOptions={options.featuredFiles}
          mediaTypeOptions={options.mediaTypes}
        />
      ) : (
        <ProPanel className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">Project Media</h3>
          <p className="text-sm text-muted-foreground">
            Media relation manager is temporarily unavailable for this project.
          </p>
          <ProStatusBadge label="Unavailable" status="warning" />
          <div>
            <p className="text-sm text-muted-foreground">{mediaResult.message}</p>
          </div>
        </ProPanel>
      )}
    </section>
  )
}
