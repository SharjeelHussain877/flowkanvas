import { randomUUID } from "node:crypto"

import { logSecurityEvent } from "@/lib/security/audit-log"
import { TemplateServiceError } from "@/lib/services/templates/errors"
import { requireAuthenticatedUserId } from "@/lib/services/templates/require-user"
import { createClient } from "@/lib/supabase/server"
import {
  ALLOWED_ASSET_MIME_TYPES,
  MAX_ASSET_BYTES,
} from "@/schemas/templates/generate"

const EXTENSIONS: Record<(typeof ALLOWED_ASSET_MIME_TYPES)[number], string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
}

const BUCKET = "template-assets"

export async function uploadTemplateAsset(
  file: File,
  templateId: string | null
): Promise<{ url: string }> {
  const userId = await requireAuthenticatedUserId()
  const mimeType = file.type as (typeof ALLOWED_ASSET_MIME_TYPES)[number]

  if (!ALLOWED_ASSET_MIME_TYPES.includes(mimeType)) {
    logSecurityEvent({
      event: "template.asset.rejected",
      userId,
      code: "INVALID_FILE_TYPE",
      message: file.type,
    })
    throw new TemplateServiceError(
      "Upload a PNG or JPEG image. WebP and SVG are not supported in PDFs.",
      400,
      "INVALID_FILE_TYPE"
    )
  }

  if (file.size > MAX_ASSET_BYTES) {
    throw new TemplateServiceError(
      "Image must be 5 MB or smaller",
      400,
      "FILE_TOO_LARGE"
    )
  }

  const supabase = await createClient()
  const folder = templateId ? `${userId}/${templateId}` : userId
  const objectPath = `${folder}/${randomUUID()}.${EXTENSIONS[mimeType]}`
  const bytes = Buffer.from(await file.arrayBuffer())

  const { error } = await supabase.storage.from(BUCKET).upload(objectPath, bytes, {
    contentType: file.type,
    cacheControl: "31536000",
    upsert: false,
  })

  if (error) {
    const lower = error.message.toLowerCase()
    const isMissingBucket =
      lower.includes("bucket not found") || lower.includes("does not exist")

    throw new TemplateServiceError(
      isMissingBucket
        ? "Image storage is not set up yet. Apply the Supabase migration at supabase/migrations/20261124000000_templates.sql."
        : "Failed to upload image",
      isMissingBucket ? 503 : 500,
      isMissingBucket ? "BUCKET_NOT_FOUND" : "UPLOAD_FAILED",
      error.message
    )
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(objectPath)

  return { url: publicUrl }
}
