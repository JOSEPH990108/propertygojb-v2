import { Badge } from "@/components/ui/badge"

type UserRoleBadgeProps = {
  roleCode: "CUSTOMER" | "AGENT" | "ADMIN" | "SUPER_ADMIN" | null
}

export function UserRoleBadge({ roleCode }: UserRoleBadgeProps) {
  if (!roleCode) {
    return <Badge variant="outline">Unknown</Badge>
  }

  if (roleCode === "SUPER_ADMIN") {
    return <Badge variant="destructive">SUPER_ADMIN</Badge>
  }

  if (roleCode === "ADMIN") {
    return <Badge variant="default">ADMIN</Badge>
  }

  if (roleCode === "AGENT") {
    return <Badge variant="secondary">AGENT</Badge>
  }

  return <Badge variant="outline">CUSTOMER</Badge>
}
