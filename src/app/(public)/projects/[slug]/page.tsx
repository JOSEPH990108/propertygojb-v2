import { PagePlaceholder } from "@/components/layout/page-placeholder"

type ProjectDetailsPageProps = {
  params: Promise<{
    slug: string
  }>
}

export default async function ProjectDetailsPage({ params }: ProjectDetailsPageProps) {
  const { slug } = await params

  return (
    <PagePlaceholder
      eyebrow="Public"
      title="Project details"
      description={`Dynamic project page placeholder for slug: ${slug}. Section layout is prepared for future content blocks.`}
    />
  )
}
