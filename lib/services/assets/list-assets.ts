import { ASSET_BUCKET, assetFolder, toAssetRecord } from "@/lib/services/assets/asset-storage"
import { TemplateServiceError } from "@/lib/services/templates/errors"
import { requireAuthenticatedUserId } from "@/lib/services/templates/require-user"
import { createClient } from "@/lib/supabase/server"
import type { AssetRecord } from "@/schemas/assets/asset"

export async function listAssets(): Promise<AssetRecord[]> {
  const userId = await requireAuthenticatedUserId()
  const supabase = await createClient()

  const { data, error } = await supabase.storage.from(ASSET_BUCKET).list(assetFolder(userId), {
    limit: 500,
    sortBy: { column: "created_at", order: "desc" },
  })

  if (error) {
    throw new TemplateServiceError("Failed to load assets", 500, "LIST_FAILED", error.message)
  }

  return (data ?? [])
    .filter((object) => object.name && !object.name.startsWith("."))
    .map((object) => toAssetRecord(userId, object))
}
