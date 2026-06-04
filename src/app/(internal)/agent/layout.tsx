import { requireRole } from "@/lib/auth/guards"
import { InternalShell } from "@/components/internal/shell"

type AgentLayoutProps = {
  children: React.ReactNode
}

export default async function AgentLayout({ children }: AgentLayoutProps) {
  await requireRole(["AGENT"], {
    nextPath: "/agent",
  })

  return <InternalShell portal="agent">{children}</InternalShell>
}
