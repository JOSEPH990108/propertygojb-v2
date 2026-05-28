import { InternalShell } from "@/components/layout/internal-shell"

type InternalLayoutProps = {
  children: React.ReactNode
}

export default function InternalLayout({ children }: InternalLayoutProps) {
  return <InternalShell>{children}</InternalShell>
}
