import { z } from "zod"

import { handleAuthRouteError } from "@/lib/api/auth-route"
import {
  getSessionIdFromAccessToken,
} from "@/lib/services/sessions/session-utils"
import {
  syncCurrentSessionDevice,
} from "@/lib/services/sessions/list-sessions"
import { createClient } from "@/lib/supabase/server"
import { AuthServiceError } from "@/lib/services/auth/errors"

const syncDeviceSchema = z.object({
  userAgent: z.string().trim().min(1).max(512),
})

export async function POST(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = syncDeviceSchema.safeParse(body)

  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  try {
    const supabase = await createClient({ requestHeaders: request.headers })
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

    await syncCurrentSessionDevice(currentSessionId, parsed.data.userAgent)

    return Response.json({ data: { success: true as const } })
  } catch (error) {
    return handleAuthRouteError(error)
  }
}
