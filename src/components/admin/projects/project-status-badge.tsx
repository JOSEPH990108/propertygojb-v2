import { ProStatusBadge } from "@/components/pro-ui"

type ProjectStatusBadgeProps = {
  statusName: string | null
}

export function ProjectStatusBadge({ statusName }: ProjectStatusBadgeProps) {
  if (!statusName) {
    return <ProStatusBadge label="Not set" status="neutral" mode="outline" />
  }

  return <ProStatusBadge label={statusName} status="pending" />
}
