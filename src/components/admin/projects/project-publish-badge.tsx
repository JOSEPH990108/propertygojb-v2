import { ProStatusBadge } from "@/components/pro-ui"

type ProjectPublishBadgeProps = {
  isPublished: boolean
}

export function ProjectPublishBadge({ isPublished }: ProjectPublishBadgeProps) {
  if (isPublished) {
    return <ProStatusBadge label="Published" status="published" />
  }

  return <ProStatusBadge label="Draft" status="draft" />
}
