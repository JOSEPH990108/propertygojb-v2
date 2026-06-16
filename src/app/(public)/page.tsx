import Link from "next/link"

import { ProjectCard } from "@/components/public/project-card"
import { PublicInquiryForm } from "@/components/public/public-inquiry-form"
import { ROUTES } from "@/config/routes"
import {
  listFeaturedPublicProjects,
  listPublicProjectOptions,
  listPublicProjects,
} from "@/lib/public/projects/actions"

export default async function PublicHomePage() {
  const [featuredProjects, projectOptions, projectDirectory] = await Promise.all([
    listFeaturedPublicProjects(3),
    listPublicProjectOptions(),
    listPublicProjects({ page: 1, pageSize: 1 }),
  ])

  return (
    <section className="public-copy space-y-12">
      <div className="public-panel public-fade-up relative overflow-hidden p-6 md:p-8 lg:p-10">
        <div className="absolute -left-10 top-4 h-44 w-44 rounded-full bg-blue-300/25 blur-3xl" />
        <div className="absolute -right-10 bottom-0 h-52 w-52 rounded-full bg-amber-300/25 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
          <div className="space-y-5">
            <p className="public-kicker">Public property funnel</p>

            <h1 className="public-heading text-4xl leading-tight text-slate-900 md:text-5xl lg:text-[3.2rem]">
              Find project clarity fast.
              <span className="block text-[color:var(--public-accent-strong)]">Ask once, route smart.</span>
            </h1>

            <p className="max-w-2xl text-base leading-7 text-slate-600">
              Explore published developments, compare practical details, and submit inquiry or viewing requests that move straight into PropertyGo internal workflow.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href={ROUTES.public.projects}
                className="rounded-xl bg-[color:var(--public-accent-strong)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[color:var(--public-accent-soft)]"
              >
                Browse projects
              </Link>
              <Link
                href={ROUTES.public.bookViewing}
                className="rounded-xl border border-slate-300/70 bg-background/70 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-background"
              >
                Book viewing slot
              </Link>
            </div>
          </div>

          <div className="grid gap-3">
            <div className="public-panel-subtle p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Published projects</p>
              <p className="public-heading mt-2 text-3xl font-semibold text-slate-900">{projectDirectory.total}</p>
            </div>
            <div className="public-panel-subtle p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Routing mode</p>
              <p className="mt-2 text-sm font-medium text-slate-700">WEB_FORM leads pushed to internal pipeline with audit trace.</p>
            </div>
          </div>
        </div>
      </div>

      <section className="public-fade-up-delay-1 space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="public-kicker">Curated listings</p>
            <h2 className="public-heading text-3xl text-slate-900">Featured projects</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Published inventory prioritized for active campaigns and launch windows.
            </p>
          </div>

          <Link
            href={ROUTES.public.projects}
            className="rounded-full border border-border/70 bg-background/80 px-4 py-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80"
          >
            View full directory
          </Link>
        </div>

        {featuredProjects.length === 0 ? (
          <div className="public-panel-subtle border-dashed p-6 text-sm text-muted-foreground">
            No published projects yet. Use inquiry form below and team will share early-access opportunities.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {featuredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </section>

      <section className="public-panel public-fade-up-delay-2 grid gap-6 p-5 md:p-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-3">
          <p className="public-kicker">Quick inquiry</p>
          <h2 className="public-heading text-3xl text-slate-900">Tell us what you need.</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            Share location preference, budget direction, and purchase timeline. PropertyGo team will follow up with matched options.
          </p>
          <p className="text-sm leading-7 text-muted-foreground">
            Need tour scheduling instead?
            <Link href={ROUTES.public.bookViewing} className="ml-1 font-semibold text-primary hover:text-primary/80">
              Use dedicated viewing form.
            </Link>
          </p>
        </div>

        <div className="public-panel-subtle p-4 md:p-5">
          <PublicInquiryForm projects={projectOptions} nextPath={ROUTES.public.home} submitLabel="Submit inquiry" />
        </div>
      </section>
    </section>
  )
}
