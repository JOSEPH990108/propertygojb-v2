import { requireRole } from "@/lib/auth/guards"

type AdminLayoutProps = {
  children: React.ReactNode
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  await requireRole(["ADMIN", "SUPER_ADMIN"], {
    nextPath: "/admin",
  })

  return <>{children}</>
}
