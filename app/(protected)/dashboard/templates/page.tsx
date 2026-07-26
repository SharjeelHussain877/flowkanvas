import { Plus } from "lucide-react"
import Link from "next/link"

import { TemplatesList } from "@/app/(protected)/dashboard/templates/_components/templates-list"
import { authPrimaryButtonClassName } from "@/app/(auth)/_components/auth-submit-button"
import { DashboardPage } from "@/components/dashboard/dashboard-page"
import { Button } from "@/components/ui/button"
import {
  getCanvaConnectFlash,
  type CanvaOAuthSearchParams,
} from "@/lib/canva/oauth-notice"
import { dashboardRoutes } from "@/lib/dashboard/routes"
import { getCanvaTemplatesPageData } from "@/lib/services/canva/get-templates-page-data"
import type { CanvaTemplatesPageData } from "@/schemas/canva/templates"
import { cn } from "@/lib/utils"

type TemplatesPageProps = {
  searchParams: Promise<CanvaOAuthSearchParams>
}

export default async function TemplatesPage({ searchParams }: TemplatesPageProps) {
  const canvaSearchParams = await searchParams
  const connectFlash = getCanvaConnectFlash(canvaSearchParams)

  let initialData: CanvaTemplatesPageData = {
    connected: false,
    items: [],
    brandTemplatesError: null,
  }
  let loadError: string | null = null

  try {
    initialData = await getCanvaTemplatesPageData()
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Failed to load Canva templates"
  }

  return (
    <DashboardPage
      title="Templates"
      description={
        initialData.connected
          ? "Designs and brand templates from your connected Canva account."
          : "Connect Canva to import designs and brand templates."
      }
      action={
        <Button asChild className={cn(authPrimaryButtonClassName, "px-4")}>
          <Link href={dashboardRoutes.templateNew}>
            Create Template
            <Plus className="size-4" aria-hidden />
          </Link>
        </Button>
      }
    >
      <TemplatesList
        initialData={initialData}
        loadError={loadError}
        connectFlash={connectFlash}
      />
    </DashboardPage>
  )
}
