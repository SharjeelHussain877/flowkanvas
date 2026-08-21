import { notFound, redirect } from "next/navigation"

import { TemplatePayloadView } from "@/app/(protected)/dashboard/templates/_components/template-payload-view"
import { PdfPlayground } from "@/components/canva/pdf-playground"
import { DashboardPage } from "@/components/dashboard/dashboard-page"
import { dashboardRoutes } from "@/lib/dashboard/routes"
import { CanvaServiceError } from "@/lib/services/canva/errors"
import { getCanvaTemplateDetail } from "@/lib/services/canva/get-template-detail"
import { isCanvaTokenRevokedError } from "@/lib/services/canva/token-revoked"

type TemplateDetailPageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ kind?: string }>
}

export default async function TemplateDetailPage({
  params,
  searchParams,
}: TemplateDetailPageProps) {
  const { id } = await params
  const { kind } = await searchParams

  try {
    const template = await getCanvaTemplateDetail(id, kind)

    return (
      <DashboardPage
        title={template.title}
        description="Example payload for this Canva design."
      >
        <div className="space-y-4">
          <TemplatePayloadView template={template} />
          <PdfPlayground initialTemplate={template} />
        </div>
      </DashboardPage>
    )
  } catch (error) {
    if (isCanvaTokenRevokedError(error)) {
      redirect(dashboardRoutes.templates)
    }

    if (error instanceof CanvaServiceError && error.code === "NOT_CONNECTED") {
      redirect(dashboardRoutes.templates)
    }

    if (error instanceof CanvaServiceError && error.status === 404) {
      notFound()
    }

    throw error
  }
}
