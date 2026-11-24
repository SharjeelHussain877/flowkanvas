import { Plus } from "lucide-react"
import Link from "next/link"

import { TemplatesList } from "@/app/(protected)/dashboard/templates/_components/templates-list"
import { authPrimaryButtonClassName } from "@/app/(auth)/_components/auth-submit-button"
import { DashboardPage } from "@/components/dashboard/dashboard-page"
import { Button } from "@/components/ui/button"
import { dashboardRoutes } from "@/lib/dashboard/routes"
import { listTemplates } from "@/lib/services/templates/list-templates"
import type { TemplateRecord } from "@/schemas/templates/template"
import { cn } from "@/lib/utils"

export default async function TemplatesPage() {
  let initialData: TemplateRecord[] = []
  let loadError: string | null = null

  try {
    initialData = await listTemplates()
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Failed to load templates"
  }

  return (
    <DashboardPage
      title="Templates"
      description="Design a page of any size, add variables, then generate PDFs through the API."
      action={
        <Button asChild className={cn(authPrimaryButtonClassName, "px-4")}>
          <Link href={dashboardRoutes.templateNew}>
            Create Template
            <Plus className="size-4" aria-hidden />
          </Link>
        </Button>
      }
    >
      <TemplatesList initialData={initialData} loadError={loadError} />
    </DashboardPage>
  )
}
