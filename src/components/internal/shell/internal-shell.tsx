import { Sora, Work_Sans } from "next/font/google"

import { getInternalNavigation } from "@/config/internal-navigation"

import { InternalSidebar } from "@/components/internal/shell/internal-sidebar"
import { InternalTopbar } from "@/components/internal/shell/internal-topbar"
import type { InternalShellProps } from "@/components/internal/shell/internal-shell-types"

const internalHeading = Sora({
  subsets: ["latin"],
  variable: "--font-internal-heading",
  weight: ["500", "600", "700"],
})

const internalBody = Work_Sans({
  subsets: ["latin"],
  variable: "--font-internal-body",
  weight: ["400", "500", "600", "700"],
})

export function InternalShell({ portal, children }: InternalShellProps) {
  const navigation = getInternalNavigation(portal)

  return (
    <div
      className={`${internalHeading.variable} ${internalBody.variable} internal-shell internal-copy min-h-screen text-foreground`}
    >
      <div className="mx-auto flex min-h-screen w-full max-w-[1680px] flex-col md:flex-row xl:px-4 xl:py-4">
        <InternalSidebar portal={portal} navigation={navigation} />

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <InternalTopbar portal={portal} navigation={navigation} />

          <main
            className="flex-1 px-4 py-4 md:px-6 md:py-6 xl:px-8 xl:py-8"
            aria-label="Internal portal content"
          >
            <div className="w-full">{children}</div>
          </main>
        </div>
      </div>
    </div>
  )
}
