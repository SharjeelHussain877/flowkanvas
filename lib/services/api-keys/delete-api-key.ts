import { createClient } from "@/lib/supabase/server"
import {
  ApiKeyServiceError,
  mapSupabaseApiKeyError,
} from "@/lib/services/api-keys/errors"
import { requireAuthenticatedUserId } from "@/lib/services/api-keys/require-user"

export async function deleteApiKey(apiKeyId: string): Promise<{ id: string }> {
  const userId = await requireAuthenticatedUserId()
  const supabase = await createClient()

  const { data: existing, error: fetchError } = await supabase
    .from("api_keys")
    .select("id")
    .eq("id", apiKeyId)
    .eq("user_id", userId)
    .maybeSingle()

  if (fetchError) {
    throw mapSupabaseApiKeyError(
      fetchError,
      "Failed to load API key",
      "FETCH_FAILED"
    )
  }

  if (!existing) {
    throw new ApiKeyServiceError("API key not found", 404, "NOT_FOUND")
  }

  const { error } = await supabase
    .from("api_keys")
    .delete()
    .eq("id", apiKeyId)
    .eq("user_id", userId)

  if (error) {
    throw mapSupabaseApiKeyError(error, "Failed to delete API key", "DELETE_FAILED")
  }

  return { id: apiKeyId }
}
