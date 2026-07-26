import { DashboardPage } from "@/components/dashboard/dashboard-page"
import { ApiKeysPanel } from "@/app/(protected)/dashboard/settings/api-keys/_components/api-keys-panel"
import { getApiKeys } from "@/lib/services/api-keys/get-api-keys"
import { ApiKeyServiceError } from "@/lib/services/api-keys/errors"

export default async function SettingsApiKeysPage() {
  let initialData: Awaited<ReturnType<typeof getApiKeys>> = []
  let loadError: string | null = null

  try {
    initialData = await getApiKeys()
  } catch (error) {
    loadError =
      error instanceof ApiKeyServiceError
        ? error.message
        : "Failed to load API keys"
  }

  return (
    <DashboardPage
      title="API Keys"
      description="Create and manage keys for server-side PDF generation requests."
    >
      <ApiKeysPanel initialData={initialData} loadError={loadError} />
    </DashboardPage>
  )
}
