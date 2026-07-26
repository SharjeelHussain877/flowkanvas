import { createClient } from "@/lib/supabase/server"
import {
  ApiKeyServiceError,
  mapSupabaseApiKeyError,
} from "@/lib/services/api-keys/errors"
import { requireAuthenticatedUserId } from "@/lib/services/api-keys/require-user"
import { toPublicApiKey } from "@/lib/services/api-keys/to-public-api-key"
import type { PublicApiKey } from "@/schemas/api-keys/api-key"

export async function getApiKeys(): Promise<PublicApiKey[]> {
  const userId = await requireAuthenticatedUserId()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("api_keys")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[getApiKeys] Supabase error:", error)
    }

    throw mapSupabaseApiKeyError(error, "Failed to load API keys", "FETCH_FAILED")
  }

  return (data ?? []).map(toPublicApiKey)
}
