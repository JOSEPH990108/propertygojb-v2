import Link from "next/link"

import { ROUTES } from "@/config/routes"

export default function AboutPage() {
  return (
    <section className="public-copy space-y-8">
      <div className="space-y-2">
        <p className="public-kicker">
          About
        </p>
        <h1 className="public-heading text-4xl text-slate-900 md:text-5xl">PropertyGo mission</h1>
        <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
          PropertyGo helps buyers discover projects faster while giving internal teams structured lead
          operations from first inquiry to booking readiness.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="public-panel public-fade-up p-4 md:p-5">
          <h2 className="public-heading text-xl text-slate-900">Discovery first</h2>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            Project directory, detail pages, and search filters designed for practical decision-making.
          </p>
        </div>
        <div className="public-panel public-fade-up-delay-1 p-4 md:p-5">
          <h2 className="public-heading text-xl text-slate-900">Structured demand capture</h2>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            Contact and viewing forms are persisted into internal lead workflows with activity and
            audit traces.
          </p>
        </div>
        <div className="public-panel public-fade-up-delay-2 p-4 md:p-5">
          <h2 className="public-heading text-xl text-slate-900">Operator-ready handoff</h2>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            Every inbound request is routed through WEB_FORM source primitives for team follow-up.
          </p>
        </div>
      </div>

      <div className="public-panel p-5 md:p-6">
        <h2 className="public-heading text-3xl text-slate-900">Start your property journey</h2>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          Browse live projects, ask for recommendations, or request viewing slots.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={ROUTES.public.projects}
            className="rounded-xl bg-[color:var(--public-accent-strong)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[color:var(--public-accent-soft)]"
          >
            Explore projects
          </Link>
          <Link
            href={ROUTES.public.contact}
            className="rounded-xl border border-border bg-background/80 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-background"
          >
            Contact team
          </Link>
        </div>
      </div>
    </section>
  )
}
