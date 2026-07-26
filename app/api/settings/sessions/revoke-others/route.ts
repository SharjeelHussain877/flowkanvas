import { handleAuthRouteError } from "@/lib/api/auth-route"
import { revokeOtherSessions } from "@/lib/services/sessions/list-sessions"
import { createClient } from "@/lib/supabase/server"
import { getSessionIdFromAccessToken } from "@/lib/services/sessions/session-utils"
import { AuthServiceError } from "@/lib/services/auth/errors"

export async function POST() {
  try {
    const supabase = await createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    const currentSessionId = session?.access_token
      ? getSessionIdFromAccessToken(session.access_token)
      : null

    if (!currentSessionId) {
      throw new AuthServiceError(
        "Current session not found",
        400,
        "SESSION_NOT_FOUND"
      )
    }

    await revokeOtherSessions(currentSessionId)

    return Response.json({ data: { success: true as const } })
  } catch (error) {
    return handleAuthRouteError(error)
  }
}
