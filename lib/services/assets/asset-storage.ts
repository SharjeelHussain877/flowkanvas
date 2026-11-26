import { storagePublicUrl } from "@/lib/supabase/public-url"
import type { AssetRecord } from "@/schemas/assets/asset"

export const ASSET_BUCKET = "template-assets"

export function assetFolder(userId: string): string {
  return `${userId}/library`
}

/** Object names are `<uuid>-<original-name>.<ext>`; the uuid keeps names unique. */
function displayName(objectName: string): string {
  return objectName.replace(/^[0-9a-f-]{36}-/, "")
}

type StorageObject = {
  name: string
  created_at?: string | null
  metadata?: { size?: number; mimetype?: string } | null
}

export function toAssetRecord(userId: string, object: StorageObject): AssetRecord {
  return {
    id: object.name,
    name: displayName(object.name),
    url: storagePublicUrl(ASSET_BUCKET, `${assetFolder(userId)}/${object.name}`),
    size: object.metadata?.size ?? 0,
    contentType: object.metadata?.mimetype ?? "image/*",
    created_at: object.created_at ?? new Date(0).toISOString(),
  }
}

/** Rejects path separators and dot segments so a client cannot escape its folder. */
export function isSafeObjectName(name: string): boolean {
  return /^[A-Za-z0-9._-]{1,200}$/.test(name) && !name.includes("..")
}
