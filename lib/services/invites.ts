import { parseInviteRef } from "@/lib/auth/invite-ref"
import { getSiteUrl } from "@/lib/env"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export async function resolveInviterId(
  inviteRef: string | undefined
): Promise<string | null> {
  const parsedRef = parseInviteRef(inviteRef)
  if (!parsedRef) {
    return null
  }

  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.getUserById(parsedRef)

  if (error || !data.user) {
    return null
  }

  return data.user.id
}

export function buildInviteLink(userId: string): string {
  const params = new URLSearchParams({ ref: userId })
  return `${getSiteUrl()}/sign-up?${params.toString()}`
}

export async function getInviteCount(): Promise<number> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("get_my_invite_count")

  if (error) {
    console.error("Failed to load invite count:", error.message)
    return 0
  }

  return Number(data ?? 0)
}
