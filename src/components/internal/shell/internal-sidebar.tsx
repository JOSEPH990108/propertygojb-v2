"use client"

import { ChevronsLeft, ChevronsRight } from "lucide-react"
import * as React from "react"

import { SignOutButton } from "@/components/auth/sign-out-button"
import { ProSidebarContainer, ProSidebarRoleTag, ProSidebarWorkspace, ProSidebarSection } from "@/components/pro-ui"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import { InternalNavItem } from "@/components/internal/shell/internal-nav-item"
import type { InternalSidebarProps } from "@/components/internal/shell/internal-shell-types"

function getPortalLabel(portal: InternalSidebarProps["portal"]): string {
  return portal === "admin" ? "Admin Portal" : "Agent Portal"
}

export function InternalSidebar({ portal, navigation }: InternalSidebarProps) {
  const [collapsed, setCollapsed] = React.useState(false)

  return (
    <TooltipProvider>
      <aside
        className="md:shrink-0"
        aria-label={`${getPortalLabel(portal)} navigation`}
      >
        <div
          className={
            "flex h-full flex-col gap-4 px-3 pt-4 transition-[width] duration-300 md:sticky md:top-4 md:min-h-[calc(100vh-2rem)] md:pb-4 xl:px-0 " +
            (collapsed ? "md:w-22" : "md:w-76 xl:w-80")
          }
        >
          <ProSidebarContainer className={"relative flex flex-1 flex-col gap-4 px-4 py-5 transition-[padding] duration-300 " + (collapsed ? "md:px-2.5" : "md:px-5")}> 
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="absolute top-9 -right-3 z-20 hidden h-10 w-7 items-center justify-center rounded-r-xl rounded-l-lg border border-border/75 bg-linear-to-b from-white/96 to-surface-glass text-muted-foreground shadow-[var(--shadow-sm)] transition-all duration-200 hover:border-primary/35 hover:bg-[#f4f1ff] hover:text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30 md:flex"
                onClick={() => setCollapsed((current) => !current)}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">{collapsed ? "Expand sidebar" : "Collapse sidebar"}</TooltipContent>
          </Tooltip>

          <div className="flex items-start justify-between gap-2">
            <div className={collapsed ? "space-y-0" : "space-y-2"}>
              <p className={"internal-kicker " + (collapsed ? "sr-only" : "")}>Internal Workspace</p>
              <h2 className={"internal-heading text-lg font-semibold " + (collapsed ? "sr-only" : "")}>{getPortalLabel(portal)}</h2>
              <p className={"text-xs text-muted-foreground " + (collapsed ? "hidden" : "") }>
              {portal === "admin"
                ? "Governance, staffing, portfolio, and settings controls."
                : "Frontline lead, booking, and customer workflow tools."}
              </p>
              {collapsed ? null : <ProSidebarRoleTag role={portal === "admin" ? "Admin" : "Agent"} />}
            </div>
          </div>

          <div className={collapsed ? "hidden" : ""}>
            <ProSidebarWorkspace name={getPortalLabel(portal)} plan="Internal Plan" />
          </div>

          <Separator className="opacity-70" />

          <ProSidebarSection title="Main Navigation" className={"-mx-1 flex-1 overflow-y-auto px-1 md:mx-0 md:px-0 " + (collapsed ? "[&>p]:sr-only" : "")}>
            <nav className="flex gap-2 overflow-x-auto pb-2 md:flex-1 md:flex-col md:gap-1.5 md:overflow-y-auto md:pb-0">
              {navigation.map((item) => (
                <InternalNavItem key={item.id} item={item} compact collapsed={collapsed} />
              ))}
            </nav>
          </ProSidebarSection>

          <div className={"internal-panel-soft mt-auto space-y-2 px-3 py-3 " + (collapsed ? "px-2" : "") }>
            <p className={"text-xs font-medium text-muted-foreground " + (collapsed ? "sr-only" : "")}>Session</p>
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <SignOutButton className="w-full justify-center px-0 [&>span]:sr-only" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">Sign out</TooltipContent>
              </Tooltip>
            ) : (
              <SignOutButton className="w-full justify-center" />
            )}
          </div>
          </ProSidebarContainer>
        </div>
      </aside>
    </TooltipProvider>
  )
}
