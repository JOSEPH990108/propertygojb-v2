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
      className="border-b border-border/70 bg-card/70 md:w-68 md:shrink-0 md:border-r md:border-b-0"
      aria-label={`${getPortalLabel(portal)} navigation`}
    >
      <div className="flex h-full flex-col gap-4 p-4 md:min-h-screen md:sticky md:top-0">
        <div className="space-y-1">
          <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">Internal Portal</p>
          <h2 className="font-heading text-base font-semibold">{getPortalLabel(portal)}</h2>
        </div>

        <Separator />

        <nav className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 md:mx-0 md:block md:space-y-1 md:overflow-visible md:px-0 md:pb-0">
          {navigation.map((item) => (
            <InternalNavItem key={item.id} item={item} compact />
          ))}
        </nav>

        <div className="mt-auto space-y-2 border-t border-border/70 pt-3">
          <p className="text-xs text-muted-foreground">Session</p>
          <SignOutButton className="w-full justify-center" />
        </div>
      </div>
    </aside>
  )
}
