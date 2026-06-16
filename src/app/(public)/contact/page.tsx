import { PublicInquiryForm } from "@/components/public/public-inquiry-form"
import { ROUTES } from "@/config/routes"
import { listPublicProjectOptions } from "@/lib/public/projects/actions"

export default async function ContactPage() {
  const projectOptions = await listPublicProjectOptions()

  return (
    <section className="public-copy space-y-8">
      <div className="space-y-2">
        <p className="public-kicker">
          Contact
        </p>
        <h1 className="public-heading text-4xl text-slate-900 md:text-5xl">Connect with PropertyGo team</h1>
        <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
          Send your inquiry and we will route it to internal operations for follow-up.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="public-panel public-fade-up space-y-4 p-5 md:p-6">
          <h2 className="public-heading text-2xl text-slate-900">Contact channels</h2>
          <div className="space-y-2 text-sm leading-7 text-muted-foreground">
            <p>
              Hotline: <span className="font-medium text-foreground">+60 3-0000 0000</span>
            </p>
            <p>
              WhatsApp: <span className="font-medium text-foreground">+60 11-0000 0000</span>
            </p>
            <p>
              Email: <span className="font-medium text-foreground">hello@propertygo.local</span>
            </p>
            <p>
              Office hours: <span className="font-medium text-foreground">Daily, 9:00 AM - 6:00 PM</span>
            </p>
          </div>
          <p className="text-sm leading-7 text-muted-foreground">
            Need site visit scheduling? Use book-viewing flow for preferred date and time.
          </p>
        </div>

        <div className="public-panel public-fade-up-delay-1 p-5 md:p-6">
          <PublicInquiryForm projects={projectOptions} nextPath={ROUTES.public.contact} submitLabel="Send contact request" />
        </div>
      </div>
    </section>
  )
}
