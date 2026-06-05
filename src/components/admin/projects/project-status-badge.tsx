import { Badge } from "@/components/ui/badge"

type ProjectStatusBadgeProps = {
  statusName: string | null
}

export function ProjectStatusBadge({ statusName }: ProjectStatusBadgeProps) {
  if (!statusName) {
    return <Badge variant="outline">Not set</Badge>
  }

  return <Badge variant="secondary">{statusName}</Badge>
}
