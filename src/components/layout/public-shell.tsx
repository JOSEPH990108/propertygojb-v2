import Link from "next/link"
import { Manrope, Space_Grotesk } from "next/font/google"

import { AuthSessionAction } from "@/components/auth/auth-session-action"
import { publicNavigation } from "@/config/navigation"
import { ROUTES } from "@/config/routes"
import { cn } from "@/lib/utils"

const publicBody = Manrope({
  subsets: ["latin"],
  variable: "--font-public-body",
  weight: ["400", "500", "600", "700"],
})

const publicHeading = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-public-heading",
  weight: ["500", "600", "700"],
})

type PublicShellProps = {
  children: React.ReactNode
  className?: string
}

export function PublicShell({ children, className }: PublicShellProps) {
  return (
    <div className={cn("public-shell public-copy min-h-screen", publicBody.variable, publicHeading.variable)}>
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/68 backdrop-blur-xl supports-[backdrop-filter]:bg-background/52">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 md:px-8">
          <Link href={ROUTES.public.home} className="public-heading text-xl font-semibold tracking-tight">
            PropertyGo JB
          </Link>

          <div className="hidden items-center gap-7 md:flex">
            <nav className="flex items-center gap-5">
              {publicNavigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-background/75 hover:text-foreground"
                >
                  {item.title}
                </Link>
              ))}
            </nav>
            <AuthSessionAction />
          </div>

          <div className="md:hidden">
            <AuthSessionAction />
          </div>
        </div>

        <div className="border-t border-border/70 md:hidden">
          <nav className="mx-auto flex w-full max-w-7xl items-center gap-2 overflow-x-auto px-4 py-2">
            {publicNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="shrink-0 rounded-full border border-border/70 bg-background/85 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.title}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className={cn("mx-auto w-full max-w-7xl px-4 pb-16 pt-8 md:px-8 md:pb-20 md:pt-12", className)}>
        {children}
      </main>

      <footer className="border-t border-border/70 bg-background/58 py-8 backdrop-blur-xl">
        <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 md:grid-cols-[1.4fr_1fr_1fr] md:px-8">
          <div className="space-y-2">
            <p className="public-heading text-lg font-semibold">PropertyGo</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Public discovery funnel for smarter project search, faster inquiry routing, and clearer viewing handoff.
            </p>
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="public-heading text-sm font-semibold text-foreground">Explore</p>
            <p>
              <Link href={ROUTES.public.projects} className="transition-colors hover:text-foreground">
                Published projects
              </Link>
            </p>
            <p>
              <Link href={ROUTES.public.bookViewing} className="transition-colors hover:text-foreground">
                Viewing requests
              </Link>
            </p>
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="public-heading text-sm font-semibold text-foreground">Connect</p>
            <p>
              <Link href={ROUTES.public.contact} className="transition-colors hover:text-foreground">
                Contact team
              </Link>
            </p>
            <p>
              <Link href={ROUTES.public.about} className="transition-colors hover:text-foreground">
                About PropertyGo
              </Link>
            </p>
          </div>
        </div>

        <div className="mx-auto mt-6 w-full max-w-7xl border-t border-border/70 px-4 pt-4 text-xs text-muted-foreground md:px-8">
          Built for PropertyGo public journey. Focus: clarity, confidence, conversion.
        </div>
      </footer>
    </div>
  )
}
