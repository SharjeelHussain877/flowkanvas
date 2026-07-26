import { ChangePasswordSection } from "@/app/(protected)/dashboard/settings/_components/change-password-section"
import { SessionsSection } from "@/app/(protected)/dashboard/settings/_components/sessions-section"
import type { SessionsListResponse } from "@/schemas/settings/session"

type SecuritySectionProps = {
  initialSessions: SessionsListResponse["data"]
  sessionsLoadError?: string | null
}

export function SecuritySection({
  initialSessions,
  sessionsLoadError = null,
}: SecuritySectionProps) {
  return (
    <div className="grid gap-4">
      <ChangePasswordSection />

      <SessionsSection
        initialData={initialSessions}
        loadError={sessionsLoadError}
      />
    </div>
  )
}
