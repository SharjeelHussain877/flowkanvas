import { AuthServiceError } from "@/lib/services/auth/errors"
import {
  getSessionIdFromAccessToken,
  mapAuthSessionRows,
  type AuthSessionRow,
  type SessionsPayload,
} from "@/lib/services/sessions/session-utils"
import { createClient } from "@/lib/supabase/server"

export async function listUserSessions(): Promise<SessionsPayload> {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new AuthServiceError("Unauthorized", 401, "UNAUTHORIZED")
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const currentSessionId = session?.access_token
    ? getSessionIdFromAccessToken(session.access_token)
    : null

  const { data, error } = await supabase.rpc("get_my_auth_sessions")

  if (error) {
    throw new AuthServiceError(
      "Failed to load sessions",
      500,
      "SESSIONS_LOAD_FAILED",
      error.message
    )
  }

  const rows = (data ?? []) as AuthSessionRow[]

  return {
    sessions: mapAuthSessionRows(rows, currentSessionId),
    currentSessionId,
  }
}

export async function revokeOtherSessions(
  currentSessionId: string | null
): Promise<void> {
  if (!currentSessionId) {
    throw new AuthServiceError(
      "Current session not found",
      400,
      "SESSION_NOT_FOUND"
    )
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc("revoke_other_auth_sessions", {
    current_session_id: currentSessionId,
  })

  if (error) {
    throw new AuthServiceError(
      "Failed to sign out other devices",
      500,
      "SESSIONS_REVOKE_FAILED",
      error.message
    )
  }
}

export async function revokeSession(sessionId: string): Promise<boolean> {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const currentSessionId = session?.access_token
    ? getSessionIdFromAccessToken(session.access_token)
    : null

  const { error } = await supabase.rpc("revoke_auth_session", {
    target_session_id: sessionId,
  })

  if (error) {
    throw new AuthServiceError(
      "Failed to revoke session",
      500,
      "SESSION_REVOKE_FAILED",
      error.message
    )
  }

  return currentSessionId === sessionId
}

export async function syncCurrentSessionDevice(
  sessionId: string,
  userAgent: string
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.rpc("sync_my_auth_session_device", {
    target_session_id: sessionId,
    session_user_agent: userAgent,
  })

  if (error) {
    throw new AuthServiceError(
      "Failed to sync session device",
      500,
      "SESSION_SYNC_FAILED",
      error.message
    )
  }
}
