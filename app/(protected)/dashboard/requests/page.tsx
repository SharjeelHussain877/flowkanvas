import { RequestsList } from "@/app/(protected)/dashboard/requests/_components/requests-list"
import { DashboardPage } from "@/components/dashboard/dashboard-page"
import { listRenderRequests } from "@/lib/services/requests/list-render-requests"
import type { RenderRequestRecord } from "@/schemas/requests/render-request"

export default async function RequestsPage() {
  let initialData: RenderRequestRecord[] = []
  let loadError: string | null = null

  try {
    initialData = await listRenderRequests()
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Failed to load requests"
  }

  return (
    <DashboardPage
      title="Requests"
      description="Recent PDF generation requests from your API keys and the in-app tester."
    >
      <RequestsList initialData={initialData} loadError={loadError} />
    </DashboardPage>
  )
}
