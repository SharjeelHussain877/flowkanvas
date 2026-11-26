import { randomUUID } from "node:crypto"

import { detectImageFormat } from "@/lib/pdf/resolve-images"
import { logSecurityEvent } from "@/lib/security/audit-log"
import { ASSET_BUCKET, assetFolder, toAssetRecord } from "@/lib/services/assets/asset-storage"
import { TemplateServiceError } from "@/lib/services/templates/errors"
import { requireAuthenticatedUserId } from "@/lib/services/templates/require-user"
import { createClient } from "@/lib/supabase/server"
import { MAX_ASSET_BYTES, type AssetRecord } from "@/schemas/assets/asset"

function safeBaseName(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, "").replace(/[^A-Za-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "")
  return (base || "image").slice(0, 40)
}

/** Stores a PNG/JPEG in the user's asset library and returns its public record. */
export async function uploadAsset(file: File): Promise<AssetRecord> {
  const userId = await requireAuthenticatedUserId()

  if (file.size > MAX_ASSET_BYTES) {
    throw new TemplateServiceError("Images must be 5 MB or smaller", 400, "FILE_TOO_LARGE")
  }

  const bytes = Buffer.from(await file.arrayBuffer())
  const format = detectImageFormat(bytes)

  if (!format) {
    logSecurityEvent({
      event: "template.asset.rejected",
      userId,
      code: "INVALID_FILE_TYPE",
      message: file.type || file.name,
    })
    throw new TemplateServiceError(
      "Upload a PNG or JPEG image. WebP and SVG are not supported in PDFs.",
      400,
      "INVALID_FILE_TYPE"
    )
  }

  const contentType = format === "png" ? "image/png" : "image/jpeg"
  const objectName = `${randomUUID()}-${safeBaseName(file.name)}.${format}`
  const supabase = await createClient()

  const { error } = await supabase.storage
    .from(ASSET_BUCKET)
    .upload(`${assetFolder(userId)}/${objectName}`, bytes, {
      contentType,
      cacheControl: "31536000",
      upsert: false,
    })

  if (error) {
    const lower = error.message.toLowerCase()
    const isMissingBucket = lower.includes("bucket not found") || lower.includes("does not exist")

    throw new TemplateServiceError(
      isMissingBucket
        ? "Image storage is not set up yet. Apply the Supabase migration at supabase/migrations/20261124000000_templates.sql."
        : "Failed to upload image",
      isMissingBucket ? 503 : 500,
      isMissingBucket ? "BUCKET_NOT_FOUND" : "UPLOAD_FAILED",
      error.message
    )
  }

  return toAssetRecord(userId, {
    name: objectName,
    created_at: new Date().toISOString(),
    metadata: { size: bytes.byteLength, mimetype: contentType },
  })
}
