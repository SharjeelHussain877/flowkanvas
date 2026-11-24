import { InviteLinkButton } from "@/app/(protected)/dashboard/settings/_components/invite-link-button"
import { ProfileSection } from "@/app/(protected)/dashboard/settings/_components/profile-section"
import { SecuritySection } from "@/app/(protected)/dashboard/settings/_components/security-section"
import { DashboardPage } from "@/components/dashboard/dashboard-page"
import { buildInviteLink, getInviteCount } from "@/lib/services/invites"
import { listUserSessions } from "@/lib/services/sessions/list-sessions"
import { parseProfileFromUser } from "@/lib/services/settings/parse-profile"
import type { SessionsListResponse } from "@/schemas/settings/session"
import { createClient } from "@/lib/supabase/server"

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const inviteCount = await getInviteCount()
  const profile = parseProfileFromUser(user, inviteCount)
  const inviteLink = user ? buildInviteLink(user.id) : ""

  let initialSessions: SessionsListResponse["data"] = {
    sessions: [],
    currentSessionId: null,
  }
  let sessionsLoadError: string | null = null

  if (user) {
    try {
      initialSessions = await listUserSessions()
    } catch (error) {
      sessionsLoadError =
        error instanceof Error ? error.message : "Failed to load sessions"
    }
  }

  return (
    <DashboardPage
      title="Settings"
      description="Manage your profile and security settings."
      action={<InviteLinkButton inviteLink={inviteLink} />}
    >
      <div className="grid gap-4">
        <ProfileSection initialProfile={profile} />
        <SecuritySection
          initialSessions={initialSessions}
          sessionsLoadError={sessionsLoadError}
        />
      </div>
    </DashboardPage>
  )
}
