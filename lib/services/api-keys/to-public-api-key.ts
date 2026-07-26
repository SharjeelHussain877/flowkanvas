import { maskApiKey } from "@/lib/api-keys/mask-api-key"
import type { ApiKeyRow } from "@/types/supabase"
import type { PublicApiKey } from "@/schemas/api-keys/api-key"

export function toPublicApiKey(row: ApiKeyRow): PublicApiKey {
  return {
    id: row.id,
    name: row.name,
    key_prefix: row.key_prefix,
    masked_key: maskApiKey(row.key_prefix),
    revoked: row.revoked,
    created_at: row.created_at,
    last_used_at: row.last_used_at,
  }
}
