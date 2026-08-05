import type { CanvaTokenResponse } from "@/lib/canva/token"
import { decryptToken, encryptToken } from "@/lib/crypto/token-cipher"
import type { CanvaAccountIdentity } from "@/lib/services/canva/fetch-canva-profile"
import { CanvaServiceError } from "@/lib/services/canva/errors"
import { requireAuthenticatedUserId } from "@/lib/services/canva/require-user"
import { createAdminClient } from "@/lib/supabase/admin"

export type CanvaConnectionStatus = {
  connected: boolean
  connectedAt: string | null
  scopes: string | null
  displayName: string | null
  canvaUserId: string | null
  canvaTeamId: string | null
}

export type CanvaConnectionTokens = {
  access_token: string
  refresh_token: string
  expires_at: string
  scopes: string
}

function accountsAdmin() {
  return createAdminClient()
}

export async function getCanvaConnectionStatus(): Promise<CanvaConnectionStatus> {
  const userId = await requireAuthenticatedUserId()
  const supabase = accountsAdmin()

  const { data, error } = await supabase
    .from("accounts")
    .select("connected_at, scopes, display_name, canva_user_id, canva_team_id")
    .eq("user_id", userId)
    .maybeSingle()

  if (error) {
    throw new CanvaServiceError(error.message, 500, "CANVA_LOOKUP_FAILED")
  }

  if (!data) {
    return {
      connected: false,
      connectedAt: null,
      scopes: null,
      displayName: null,
      canvaUserId: null,
      canvaTeamId: null,
    }
  }

  return {
    connected: true,
    connectedAt: data.connected_at,
    scopes: data.scopes,
    displayName: data.display_name,
    canvaUserId: data.canva_user_id,
    canvaTeamId: data.canva_team_id,
  }
}

export async function saveCanvaConnection(
  tokens: CanvaTokenResponse,
  identity?: CanvaAccountIdentity | null
) {
  const userId = await requireAuthenticatedUserId()
  const supabase = accountsAdmin()
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()
  const now = new Date().toISOString()

  const { error } = await supabase.from("accounts").upsert(
    {
      user_id: userId,
      access_token: encryptToken(tokens.access_token, "access_token"),
      refresh_token: encryptToken(tokens.refresh_token, "refresh_token"),
      token_type: tokens.token_type,
      expires_at: expiresAt,
      scopes: tokens.scope,
      connected_at: now,
      updated_at: now,
      canva_user_id: identity?.canvaUserId ?? null,
      canva_team_id: identity?.canvaTeamId ?? null,
      display_name: identity?.displayName ?? null,
    },
    { onConflict: "user_id" }
  )

  if (error) {
    throw new CanvaServiceError(error.message, 500, "CANVA_SAVE_FAILED")
  }
}

export async function updateCanvaTokens(userId: string, tokens: CanvaTokenResponse) {
  const supabase = accountsAdmin()
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

  const { error } = await supabase
    .from("accounts")
    .update({
      access_token: encryptToken(tokens.access_token, "access_token"),
      refresh_token: encryptToken(tokens.refresh_token, "refresh_token"),
      token_type: tokens.token_type,
      expires_at: expiresAt,
      scopes: tokens.scope,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)

  if (error) {
    throw new CanvaServiceError(error.message, 500, "CANVA_SAVE_FAILED")
  }
}

export async function getCanvaConnectionTokens(
  userId: string
): Promise<CanvaConnectionTokens | null> {
  const supabase = accountsAdmin()

  const { data, error } = await supabase
    .from("accounts")
    .select("access_token, refresh_token, expires_at, scopes")
    .eq("user_id", userId)
    .maybeSingle()

  if (error) {
    throw new CanvaServiceError(error.message, 500, "CANVA_LOOKUP_FAILED")
  }

  if (!data) {
    return null
  }

  return {
    access_token: decryptToken(data.access_token, "access_token"),
    refresh_token: decryptToken(data.refresh_token, "refresh_token"),
    expires_at: data.expires_at,
    scopes: data.scopes,
  }
}

export async function deleteCanvaConnection(userId: string) {
  const supabase = accountsAdmin()

  const { error } = await supabase
    .from("accounts")
    .delete()
    .eq("user_id", userId)

  if (error) {
    throw new CanvaServiceError(error.message, 500, "CANVA_DELETE_FAILED")
  }
}
