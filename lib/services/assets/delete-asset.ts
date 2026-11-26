import { ASSET_BUCKET, assetFolder, isSafeObjectName } from "@/lib/services/assets/asset-storage"
import { TemplateServiceError } from "@/lib/services/templates/errors"
import { requireAuthenticatedUserId } from "@/lib/services/templates/require-user"
import { createClient } from "@/lib/supabase/server"

/** Removes a library image. Templates that still reference it skip it with a warning when rendering. */
export async function deleteAsset(objectName: string): Promise<{ id: string }> {
  const userId = await requireAuthenticatedUserId()

  if (!isSafeObjectName(objectName)) {
    throw new TemplateServiceError("Asset not found", 404, "NOT_FOUND")
  }

  const supabase = await createClient()
  const { data, error } = await supabase.storage
    .from(ASSET_BUCKET)
    .remove([`${assetFolder(userId)}/${objectName}`])

  if (error) {
    throw new TemplateServiceError("Failed to delete asset", 500, "DELETE_FAILED", error.message)
  }

  if (!data || data.length === 0) {
    throw new TemplateServiceError("Asset not found", 404, "NOT_FOUND")
  }

  return { id: objectName }
}
