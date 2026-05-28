import { InternalSidebar } from "@/components/layout/internal-sidebar"
import { InternalTopbar } from "@/components/layout/internal-topbar"

type InternalShellProps = {
  children: React.ReactNode
}

export function InternalShell({ children }: InternalShellProps) {
  return (
    <div className="min-h-screen bg-muted/20">
      <div className="mx-auto flex min-h-screen w-full max-w-screen-2xl">
        <InternalSidebar />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <InternalTopbar />
          <main className="flex-1 px-4 py-6 md:px-6 md:py-8">{children}</main>
        </div>
      </div>
    </div>
  )
}
