import { PublicBookViewingForm } from "@/components/public/public-book-viewing-form"
import { ROUTES } from "@/config/routes"
import { listPublicProjectOptions } from "@/lib/public/projects/actions"

export default async function BookViewingPage() {
  const projectOptions = await listPublicProjectOptions()

  return (
    <section className="public-copy space-y-8">
      <div className="space-y-2">
        <p className="public-kicker">
          Book viewing
        </p>
        <h1 className="public-heading text-4xl text-slate-900 md:text-5xl">Request your preferred viewing slot</h1>
        <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
          Share preferred date, time, and project so our team can coordinate site viewing details.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="public-panel public-fade-up space-y-4 p-5 md:p-6">
          <h2 className="public-heading text-2xl text-slate-900">What happens next</h2>
          <ol className="space-y-2 text-sm leading-7 text-muted-foreground">
            <li>1. Submit preferred date and project context.</li>
            <li>2. PropertyGo team confirms site availability.</li>
            <li>3. Assigned agent shares final schedule details.</li>
          </ol>
          <p className="text-sm leading-7 text-muted-foreground">
            If you are still comparing options, leave project field empty and we will recommend
            matches first.
          </p>
        </div>

        <div className="public-panel public-fade-up-delay-1 p-5 md:p-6">
          <PublicBookViewingForm projects={projectOptions} nextPath={ROUTES.public.bookViewing} />
        </div>
      </div>
    </section>
  )
}
