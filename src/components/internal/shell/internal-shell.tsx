import { getInternalNavigation } from "@/config/internal-navigation"

import { InternalSidebar } from "@/components/internal/shell/internal-sidebar"
import { InternalTopbar } from "@/components/internal/shell/internal-topbar"
import type { InternalShellProps } from "@/components/internal/shell/internal-shell-types"

export function InternalShell({ portal, children }: InternalShellProps) {
  const navigation = getInternalNavigation(portal)

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 text-foreground">
      <div className="flex min-h-screen flex-col md:flex-row">
        <InternalSidebar portal={portal} navigation={navigation} />

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <InternalTopbar portal={portal} navigation={navigation} />

          <main className="flex-1 px-4 py-4 md:px-6 md:py-6" aria-label="Internal portal content">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </div>
  )
}
