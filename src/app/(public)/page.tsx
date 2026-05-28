import Link from "next/link"

import { PagePlaceholder } from "@/components/layout/page-placeholder"
import { ROUTES } from "@/config/routes"

export default function PublicHomePage() {
  return (
    <PagePlaceholder
      eyebrow="External Showcase"
      title="PropertyGo Showcase"
      description="This is the initial public experience shell. Listing modules and campaign blocks will be added in future feature slices."
    >
      <div className="flex flex-wrap gap-3">
        <Link
          href={ROUTES.public.projects}
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          Browse projects
        </Link>
        <Link
          href={ROUTES.public.bookViewing}
          className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium"
        >
          Book a viewing
        </Link>
      </div>
    </PagePlaceholder>
  )
}
