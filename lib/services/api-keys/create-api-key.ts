import { generateApiKey } from "@/lib/api-keys/generate-api-key"
import { hashApiKey } from "@/lib/api-keys/hash-api-key"
import { createClient } from "@/lib/supabase/server"
import { mapSupabaseApiKeyError } from "@/lib/services/api-keys/errors"
import { requireAuthenticatedUserId } from "@/lib/services/api-keys/require-user"
import { toPublicApiKey } from "@/lib/services/api-keys/to-public-api-key"
import type { CreateApiKeyInput } from "@/schemas/api-keys/create-api-key"
import type { CreateApiKeyResponse } from "@/schemas/api-keys/api-key"

export async function createApiKey(
  input: CreateApiKeyInput
): Promise<CreateApiKeyResponse> {
  const userId = await requireAuthenticatedUserId()
  const supabase = await createClient()
  const { secret, keyPrefix } = generateApiKey()
  const keyHash = hashApiKey(secret)

  const { data, error } = await supabase
    .from("api_keys")
    .insert({
      user_id: userId,
      name: input.name.trim(),
      key_prefix: keyPrefix,
      key_hash: keyHash,
    })
    .select("*")
    .single()

  if (error || !data) {
    if (process.env.NODE_ENV === "development" && error) {
      console.error("[createApiKey] Supabase error:", error)
    }

    throw error
      ? mapSupabaseApiKeyError(error, "Failed to create API key", "CREATE_FAILED")
      : mapSupabaseApiKeyError(
          { message: "No row returned after insert" },
          "Failed to create API key",
          "CREATE_FAILED"
        )
  }

  return {
    key: toPublicApiKey(data),
    secret,
  }
}
