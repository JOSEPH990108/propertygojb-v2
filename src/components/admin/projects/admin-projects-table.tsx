import Link from "next/link"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ProjectPublishBadge } from "@/components/admin/projects/project-publish-badge"
import { ProjectStatusBadge } from "@/components/admin/projects/project-status-badge"
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
      <div className="internal-empty-state">
        No projects found for the current filters.
      </div>
    )
  }

  return (
    <Table>
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
              <ProjectStatusBadge statusName={project.projectStatusName} />
            </TableCell>
            <TableCell>
              <ProjectPublishBadge isPublished={project.isPublished} />
            </TableCell>
            <TableCell>{renderType(project)}</TableCell>
            <TableCell>{renderTenureTitle(project)}</TableCell>
            <TableCell>{project.totalUnits}</TableCell>
            <TableCell>{project.launchYear ?? "-"}</TableCell>
            <TableCell>{formatDateTime(project.createdAt)}</TableCell>
            <TableCell>{formatDateTime(project.updatedAt)}</TableCell>
            <TableCell>
              <Button asChild size="sm" variant="outline">
                <Link href={ROUTES.admin.projectEdit(project.id)}>Edit</Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
