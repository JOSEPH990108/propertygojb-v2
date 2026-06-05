import Link from "next/link"

import { ProjectForm } from "@/components/admin/projects/project-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ROUTES } from "@/config/routes"
import { getAdminProjectFormOptions } from "@/lib/admin/projects/actions"

export default async function AdminProjectNewPage() {
  const options = await getAdminProjectFormOptions()

  return (
    <section className="mx-auto w-full max-w-6xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Create Project</CardTitle>
          <CardDescription>
            Add a property project record for internal operations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" size="sm">
            <Link href={ROUTES.admin.projects}>Back to Projects</Link>
          </Button>
        </CardContent>
      </Card>

      <ProjectForm mode="create" options={options} />
    </section>
  )
}
