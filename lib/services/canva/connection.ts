import type { CanvaTokenResponse } from "@/lib/canva/token"
import { createClient } from "@/lib/supabase/server"
import { CanvaServiceError } from "@/lib/services/canva/errors"
import { requireAuthenticatedUserId } from "@/lib/services/canva/require-user"

export type CanvaConnectionStatus = {
  connected: boolean
  connectedAt: string | null
  scopes: string | null
}

export async function getCanvaConnectionStatus(): Promise<CanvaConnectionStatus> {
  const userId = await requireAuthenticatedUserId()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("accounts")
    .select("connected_at, scopes")
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
    }
  }

  return {
    connected: true,
    connectedAt: data.connected_at,
    scopes: data.scopes,
  }
}

export async function saveCanvaConnection(tokens: CanvaTokenResponse) {
  const userId = await requireAuthenticatedUserId()
  const supabase = await createClient()
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()
  const now = new Date().toISOString()

  const { error } = await supabase.from("accounts").upsert(
    {
      user_id: userId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_type: tokens.token_type,
      expires_at: expiresAt,
      scopes: tokens.scope,
      connected_at: now,
      updated_at: now,
    },
    { onConflict: "user_id" }
  )

  if (error) {
    throw new CanvaServiceError(error.message, 500, "CANVA_SAVE_FAILED")
  }
}

export async function updateCanvaTokens(userId: string, tokens: CanvaTokenResponse) {
  const supabase = await createClient()
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

  const { error } = await supabase
    .from("accounts")
    .update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
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

export async function getCanvaConnectionTokens(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("accounts")
    .select("access_token, refresh_token, expires_at, scopes")
    .eq("user_id", userId)
    .maybeSingle()

  if (error) {
    throw new CanvaServiceError(error.message, 500, "CANVA_LOOKUP_FAILED")
  }

  return data
}

export async function deleteCanvaConnection(userId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("accounts")
    .delete()
    .eq("user_id", userId)

  if (error) {
    throw new CanvaServiceError(error.message, 500, "CANVA_DELETE_FAILED")
  }
}
