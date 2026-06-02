import { requireRole } from "@/lib/auth/guards"

type AgentLayoutProps = {
  children: React.ReactNode
}

export default async function AgentLayout({ children }: AgentLayoutProps) {
  await requireRole(["AGENT"], {
    nextPath: "/agent",
  })

  return <>{children}</>
}
