import { SignOutButton } from "@/components/auth/sign-out-button"
import { Separator } from "@/components/ui/separator"

import { InternalNavItem } from "@/components/internal/shell/internal-nav-item"
import type { InternalSidebarProps } from "@/components/internal/shell/internal-shell-types"

function getPortalLabel(portal: InternalSidebarProps["portal"]): string {
  return portal === "admin" ? "Admin Portal" : "Agent Portal"
}

export function InternalSidebar({ portal, navigation }: InternalSidebarProps) {
  return (
    <aside
      className="md:w-76 md:shrink-0 xl:w-80"
      aria-label={`${getPortalLabel(portal)} navigation`}
    >
      <div className="flex h-full flex-col gap-4 pt-4 md:sticky md:top-4 md:min-h-[calc(100vh-2rem)] md:pb-4">
        <div className="internal-panel flex flex-1 flex-col gap-4 px-4 py-5">
          <div className="space-y-2">
            <p className="internal-kicker">Internal Workspace</p>
            <h2 className="internal-heading text-lg font-semibold">{getPortalLabel(portal)}</h2>
            <p className="text-xs text-muted-foreground">
              {portal === "admin"
                ? "Governance, staffing, portfolio, and settings controls."
                : "Frontline lead, booking, and customer workflow tools."}
            </p>
          </div>

          <Separator className="opacity-70" />

          <nav className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 md:mx-0 md:flex-1 md:flex-col md:gap-1 md:overflow-y-auto md:px-0 md:pb-0">
            {navigation.map((item) => (
              <InternalNavItem key={item.id} item={item} compact />
            ))}
          </nav>

          <div className="internal-panel-soft mt-auto space-y-2 px-3 py-3">
            <p className="text-xs font-medium text-muted-foreground">Session</p>
            <SignOutButton className="w-full justify-center" />
          </div>
        </div>
      </div>
    </aside>
  )
}
