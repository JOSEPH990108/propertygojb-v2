import Link from "next/link"

import { publicNavigation } from "@/config/navigation"
import { ROUTES } from "@/config/routes"
import { cn } from "@/lib/utils"

type PublicShellProps = {
  children: React.ReactNode
  className?: string
}

export function PublicShell({ children, className }: PublicShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/70 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 md:px-6">
          <Link href={ROUTES.public.home} className="font-heading text-lg font-semibold">
            PropertyGo
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            {publicNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.title}
              </Link>
            ))}
            <Link
              href={ROUTES.auth.login}
              className="rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background"
            >
              Login
            </Link>
          </nav>
        </div>
      </header>

      <main className={cn("mx-auto w-full max-w-6xl px-4 py-10 md:px-6 md:py-14", className)}>
        {children}
      </main>

      <footer className="border-t border-border/70 py-6">
        <div className="mx-auto w-full max-w-6xl px-4 text-sm text-muted-foreground md:px-6">
          Built for the next phase of PropertyGo.
        </div>
      </footer>
    </div>
  )
}
