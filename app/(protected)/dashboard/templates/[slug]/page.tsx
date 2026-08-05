import { notFound } from "next/navigation"

import { TemplateWorkspace } from "../_components/template-workspace"
import { DashboardPage } from "@/components/dashboard/dashboard-page"
import { Badge } from "@/components/ui/badge"
import { findTemplateBySlug } from "@/lib/dashboard/mock-data"

type TemplatePageProps = {
  params: Promise<{ slug: string }>
}

export default async function TemplatePage({ params }: TemplatePageProps) {
  const { slug } = await params
  const template = findTemplateBySlug(slug)

  if (!template) {
    notFound()
  }

  const isDraft = template.status === "draft"

  return (
    <DashboardPage
      title={template.title}
      description={`Template workspace - ${isDraft ? "draft" : "saved"} template.`}
      action={
        <Badge variant={isDraft ? "secondary" : "default"}>
          {isDraft ? "Draft" : "Saved"}
        </Badge>
      }
    >
      <TemplateWorkspace template={template} />
    </DashboardPage>
  )
}
