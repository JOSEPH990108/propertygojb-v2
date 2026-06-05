import { Badge } from "@/components/ui/badge"

type ProjectPublishBadgeProps = {
  isPublished: boolean
}

export function ProjectPublishBadge({ isPublished }: ProjectPublishBadgeProps) {
  if (isPublished) {
    return <Badge>Published</Badge>
  }

  return <Badge variant="outline">Draft</Badge>
}
