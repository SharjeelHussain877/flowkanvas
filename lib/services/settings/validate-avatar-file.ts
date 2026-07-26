import { AuthServiceError } from "@/lib/services/auth/errors"
import {
  ALLOWED_AVATAR_MIME_TYPES,
  MAX_AVATAR_SIZE_BYTES,
} from "@/schemas/settings/upload-avatar"
import type { SupabaseClient } from "@supabase/supabase-js"

const ALLOWED_EXTENSIONS: Record<(typeof ALLOWED_AVATAR_MIME_TYPES)[number], string> =
  {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  }

export function validateAvatarFile(file: File): void {
  if (
    !ALLOWED_AVATAR_MIME_TYPES.includes(
      file.type as (typeof ALLOWED_AVATAR_MIME_TYPES)[number]
    )
  ) {
    throw new AuthServiceError(
      "Upload a JPG, PNG, or WebP image",
      400,
      "INVALID_FILE_TYPE"
    )
  }

  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    throw new AuthServiceError(
      "Image must be 2 MB or smaller",
      400,
      "FILE_TOO_LARGE"
    )
  }
}

export function getAvatarObjectPath(userId: string, mimeType: string): string {
  const extension =
    ALLOWED_EXTENSIONS[
      mimeType as (typeof ALLOWED_AVATAR_MIME_TYPES)[number]
    ] ?? "jpg"

  return `${userId}/avatar.${extension}`
}

export async function storeAvatarFile(
  supabase: SupabaseClient,
  userId: string,
  file: File
): Promise<string> {
  validateAvatarFile(file)

  const objectPath = getAvatarObjectPath(userId, file.type)
  const fileBuffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(objectPath, fileBuffer, {
      contentType: file.type,
      upsert: true,
      cacheControl: "3600",
    })

  if (uploadError) {
    const isMissingBucket =
      uploadError.message.toLowerCase().includes("bucket not found") ||
      uploadError.message.toLowerCase().includes("does not exist")

    throw new AuthServiceError(
      isMissingBucket
        ? "Profile photo storage is not set up yet. Apply the Supabase migration at supabase/migrations/20260726000000_flowkanvas_schema.sql."
        : "Failed to upload profile photo",
      isMissingBucket ? 503 : 500,
      isMissingBucket ? "BUCKET_NOT_FOUND" : "UPLOAD_FAILED",
      uploadError.message
    )
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(objectPath)

  return `${publicUrl}?v=${Date.now()}`
}
