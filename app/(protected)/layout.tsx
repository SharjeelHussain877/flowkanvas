import type { ReactNode } from "react"

import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import type { SidebarUser } from "@/components/dashboard/sidebar-user-menu"
import { parseProfileFromUser } from "@/lib/services/settings/parse-profile"
import { createClient } from "@/lib/supabase/server"

function toSidebarUser(
  profile: ReturnType<typeof parseProfileFromUser>
): SidebarUser {
  const fullName = `${profile.firstName} ${profile.lastName}`.trim()

  return {
    name: fullName || profile.email.split("@")[0] || "Account",
    email: profile.email,
    initials: profile.initials,
    avatarUrl: profile.avatarUrl,
  }
}

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const sidebarUser = toSidebarUser(parseProfileFromUser(user))

  return <DashboardShell user={sidebarUser}>{children}</DashboardShell>
}
