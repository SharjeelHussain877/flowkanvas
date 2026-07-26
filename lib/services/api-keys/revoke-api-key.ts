import { createClient } from "@/lib/supabase/server"
import {
  ApiKeyServiceError,
  mapSupabaseApiKeyError,
} from "@/lib/services/api-keys/errors"
import { requireAuthenticatedUserId } from "@/lib/services/api-keys/require-user"
import { toPublicApiKey } from "@/lib/services/api-keys/to-public-api-key"
import type { PublicApiKey } from "@/schemas/api-keys/api-key"

export async function revokeApiKey(apiKeyId: string): Promise<PublicApiKey> {
  const userId = await requireAuthenticatedUserId()
  const supabase = await createClient()

  const { data: existing, error: fetchError } = await supabase
    .from("api_keys")
    .select("*")
    .eq("id", apiKeyId)
    .eq("user_id", userId)
    .maybeSingle()

  if (fetchError) {
    if (process.env.NODE_ENV === "development") {
      console.error("[revokeApiKey] Supabase fetch error:", fetchError)
    }

    throw mapSupabaseApiKeyError(
      fetchError,
      "Failed to load API key",
      "FETCH_FAILED"
    )
  }

  if (!existing) {
    throw new ApiKeyServiceError("API key not found", 404, "NOT_FOUND")
  }

  if (existing.revoked) {
    return toPublicApiKey(existing)
  }

  const { data, error } = await supabase
    .from("api_keys")
    .update({ revoked: true })
    .eq("id", apiKeyId)
    .eq("user_id", userId)
    .select("*")
    .single()

  if (error || !data) {
    if (process.env.NODE_ENV === "development" && error) {
      console.error("[revokeApiKey] Supabase update error:", error)
    }

    throw error
      ? mapSupabaseApiKeyError(error, "Failed to revoke API key", "REVOKE_FAILED")
      : mapSupabaseApiKeyError(
          { message: "No row returned after revoke" },
          "Failed to revoke API key",
          "REVOKE_FAILED"
        )
  }

  return toPublicApiKey(data)
}
