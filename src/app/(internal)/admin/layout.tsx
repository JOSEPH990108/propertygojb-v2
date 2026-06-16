import { requireRole } from "@/lib/auth/guards"
import { InternalShell } from "@/components/internal/shell"

type AdminLayoutProps = {
  children: React.ReactNode
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  await requireRole(["ADMIN", "SUPER_ADMIN"], {
    nextPath: "/admin",
  })

  return <InternalShell portal="admin">{children}</InternalShell>
}
