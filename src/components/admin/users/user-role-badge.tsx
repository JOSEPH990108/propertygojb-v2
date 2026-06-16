import { ProStatusBadge } from "@/components/pro-ui"

type UserRoleBadgeProps = {
  roleCode: "CUSTOMER" | "AGENT" | "ADMIN" | "SUPER_ADMIN" | null
}

export function UserRoleBadge({ roleCode }: UserRoleBadgeProps) {
  if (!roleCode) {
    return <ProStatusBadge label="Unknown" status="neutral" />
  }

  if (roleCode === "SUPER_ADMIN") {
    return <ProStatusBadge label="SUPER_ADMIN" status="error" />
  }

  if (roleCode === "ADMIN") {
    return <ProStatusBadge label="ADMIN" status="published" />
  }

  if (roleCode === "AGENT") {
    return <ProStatusBadge label="AGENT" status="info" />
  }

  return <ProStatusBadge label="CUSTOMER" status="neutral" />
}
