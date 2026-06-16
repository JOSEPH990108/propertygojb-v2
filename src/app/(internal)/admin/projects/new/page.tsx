import Link from "next/link"

import { ProjectForm } from "@/components/admin/projects/project-form"
import { ActionCard, ProButton } from "@/components/pro-ui"
import { ROUTES } from "@/config/routes"
import { getAdminProjectFormOptions } from "@/lib/admin/projects/actions"

export default async function AdminProjectNewPage() {
  const options = await getAdminProjectFormOptions()

  return (
    <section className="internal-page">
      <ActionCard
        title="Create Project"
        description="Add a property project record for internal operations."
      >
        <div>
          <ProButton asChild variant="outline" size="sm">
            <Link href={ROUTES.admin.projects}>Back to Projects</Link>
          </ProButton>
        </div>
      </ActionCard>

      <ProjectForm mode="create" options={options} />
    </section>
  )
}
