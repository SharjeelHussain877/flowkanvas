import { InviteLinkButton } from "@/app/(protected)/dashboard/settings/_components/invite-link-button"
import { CanvaSection } from "@/app/(protected)/dashboard/settings/_components/canva-section"
import { ProfileSection } from "@/app/(protected)/dashboard/settings/_components/profile-section"
import { SecuritySection } from "@/app/(protected)/dashboard/settings/_components/security-section"
import { DashboardPage } from "@/components/dashboard/dashboard-page"
import { buildInviteLink, getInviteCount } from "@/lib/services/invites"
import {
  getCanvaConnectFlash,
  type CanvaOAuthSearchParams,
} from "@/lib/canva/oauth-notice"
import { getCanvaConnectionStatus } from "@/lib/services/canva/connection"
import type { CanvaConnectionStatus } from "@/lib/services/canva/connection"
import { listUserSessions } from "@/lib/services/sessions/list-sessions"
import { parseProfileFromUser } from "@/lib/services/settings/parse-profile"
import type { SessionsListResponse } from "@/schemas/settings/session"
import { createClient } from "@/lib/supabase/server"

type SettingsPageProps = {
  searchParams: Promise<CanvaOAuthSearchParams>
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const canvaSearchParams = await searchParams
  const connectFlash = getCanvaConnectFlash(canvaSearchParams)
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

  let canvaConnection: CanvaConnectionStatus = {
    connected: false,
    connectedAt: null,
    scopes: null,
  }

  if (user) {
    try {
      canvaConnection = await getCanvaConnectionStatus()
    } catch {
      // Canva status is optional on first load.
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
        <CanvaSection
          initialConnection={canvaConnection}
          connectFlash={connectFlash}
        />
        <SecuritySection
          initialSessions={initialSessions}
          sessionsLoadError={sessionsLoadError}
        />
      </div>
    </DashboardPage>
  )
}
