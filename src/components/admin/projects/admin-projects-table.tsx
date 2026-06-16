import {
  ProTable,
  ProTableActions,
  ProTableEmptyState,
  ProTableStatusBadge,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/pro-ui"
import { ROUTES } from "@/config/routes"
import type { AdminProjectListItem } from "@/lib/admin/projects/actions"

type AdminProjectsTableProps = {
  projects: AdminProjectListItem[]
}

function formatDateTime(value: string): string {
  const date = new Date(value)

  return new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

function renderLocation(project: AdminProjectListItem): string {
  if (project.regionName && project.areaName) {
    return `${project.regionName} / ${project.areaName}`
  }

  return project.regionName ?? project.areaName ?? "-"
}

function renderType(project: AdminProjectListItem): string {
  if (project.propertyCategoryName && project.propertyTypeName) {
    return `${project.propertyCategoryName} / ${project.propertyTypeName}`
  }

  return project.propertyCategoryName ?? project.propertyTypeName ?? "-"
}

function renderTenureTitle(project: AdminProjectListItem): string {
  if (project.tenureTypeName && project.titleTypeName) {
    return `${project.tenureTypeName} / ${project.titleTypeName}`
  }

  return project.tenureTypeName ?? project.titleTypeName ?? "-"
}

export function AdminProjectsTable({ projects }: AdminProjectsTableProps) {
  if (projects.length === 0) {
    return (
      <ProTableEmptyState
        title="No projects found"
        description="Adjust filters or create a new project to get started."
      />
    )
  }

  return (
    <ProTable>
      <TableHeader>
        <TableRow>
          <TableHead>Project</TableHead>
          <TableHead>Slug</TableHead>
          <TableHead>Developer</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Publish</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Tenure / Title</TableHead>
          <TableHead>Total Units</TableHead>
          <TableHead>Launch Year</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Updated</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((project) => (
          <TableRow key={project.id}>
            <TableCell>
              <div className="flex flex-col gap-0.5">
                <span className="font-medium">{project.displayName ?? project.name}</span>
                {project.displayName ? (
                  <span className="text-xs text-muted-foreground">{project.name}</span>
                ) : null}
              </div>
            </TableCell>
            <TableCell>{project.slug}</TableCell>
            <TableCell>{project.developerName ?? "-"}</TableCell>
            <TableCell>{renderLocation(project)}</TableCell>
            <TableCell>
              <ProTableStatusBadge status={project.projectStatusName ?? "Unknown"} />
            </TableCell>
            <TableCell>
              <ProTableStatusBadge status={project.isPublished ? "Published" : "Draft"} />
            </TableCell>
            <TableCell>{renderType(project)}</TableCell>
            <TableCell>{renderTenureTitle(project)}</TableCell>
            <TableCell>{project.totalUnits}</TableCell>
            <TableCell>{project.launchYear ?? "-"}</TableCell>
            <TableCell>{formatDateTime(project.createdAt)}</TableCell>
            <TableCell>{formatDateTime(project.updatedAt)}</TableCell>
            <TableCell>
              <ProTableActions
                actions={[
                  {
                    label: "Edit",
                    href: ROUTES.admin.projectEdit(project.id),
                  },
                ]}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </ProTable>
  )
}
