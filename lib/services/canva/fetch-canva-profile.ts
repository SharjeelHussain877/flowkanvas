import { canvaApiGetWithToken } from "@/lib/canva/api-client"

type CanvaUsersMeResponse = {
  team_user?: {
    user_id?: string
    team_id?: string
  }
}

type CanvaProfileResponse = {
  profile?: {
    display_name?: string
  }
}

export type CanvaAccountIdentity = {
  canvaUserId: string | null
  canvaTeamId: string | null
  displayName: string | null
}

export async function fetchCanvaAccountIdentity(
  accessToken: string
): Promise<CanvaAccountIdentity> {
  const [me, profile] = await Promise.all([
    canvaApiGetWithToken<CanvaUsersMeResponse>(accessToken, "/users/me"),
    canvaApiGetWithToken<CanvaProfileResponse>(
      accessToken,
      "/users/me/profile"
    ).catch(() => null),
  ])

  return {
    canvaUserId: me.team_user?.user_id ?? null,
    canvaTeamId: me.team_user?.team_id ?? null,
    displayName: profile?.profile?.display_name?.trim() || null,
  }
}
