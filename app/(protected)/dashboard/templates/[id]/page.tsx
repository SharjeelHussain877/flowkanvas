import { notFound } from "next/navigation"

import { TemplateEditor } from "@/app/(protected)/dashboard/templates/[id]/_components/template-editor"
import { getSiteUrl } from "@/lib/env"
import { TemplateServiceError } from "@/lib/services/templates/errors"
import { getTemplate } from "@/lib/services/templates/get-template"
import type { TemplateRecord } from "@/schemas/templates/template"

type TemplateEditorPageProps = {
  params: Promise<{ id: string }>
}

async function loadTemplate(id: string): Promise<TemplateRecord | null> {
  try {
    return await getTemplate(id)
  } catch (error) {
    if (error instanceof TemplateServiceError && error.status === 404) {
      return null
    }

    throw error
  }
}

export default async function TemplateEditorPage({ params }: TemplateEditorPageProps) {
  const { id } = await params
  const template = await loadTemplate(id)

  if (!template) {
    notFound()
  }

  return <TemplateEditor initialTemplate={template} apiBaseUrl={getSiteUrl()} />
}
