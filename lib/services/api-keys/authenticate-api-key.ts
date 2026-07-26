import { hashApiKey } from "@/lib/api-keys/hash-api-key"
import { createAdminClient } from "@/lib/supabase/admin"
import { ApiKeyAuthError } from "@/lib/services/api-keys/errors"

export type AuthenticatedApiKeyContext = {
  id: string
  userId: string
}

export async function authenticateApiKey(
  secret: string
): Promise<AuthenticatedApiKeyContext> {
  const keyHash = hashApiKey(secret)
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("api_keys")
    .select("id, user_id, revoked")
    .eq("key_hash", keyHash)
    .maybeSingle()

  if (error) {
    throw new ApiKeyAuthError(
      "Unable to authenticate API key",
      500,
      "AUTH_LOOKUP_FAILED"
    )
  }

  if (!data) {
    throw new ApiKeyAuthError("Invalid API key", 401, "INVALID_API_KEY")
  }

  if (data.revoked) {
    throw new ApiKeyAuthError("API key has been revoked", 401, "REVOKED_API_KEY")
  }

  const now = new Date().toISOString()

  const { error: updateError } = await supabase
    .from("api_keys")
    .update({ last_used_at: now })
    .eq("id", data.id)

  if (updateError) {
    throw new ApiKeyAuthError(
      "Unable to update API key usage",
      500,
      "LAST_USED_UPDATE_FAILED"
    )
  }

  return {
    id: data.id,
    userId: data.user_id,
  }
}
