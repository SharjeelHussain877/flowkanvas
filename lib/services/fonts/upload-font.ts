import { randomUUID } from "node:crypto"

import * as fontkit from "fontkit"

import { logSecurityEvent } from "@/lib/security/audit-log"
import { mapSupabaseFontError } from "@/lib/services/fonts/errors"
import { FONT_BUCKET, toFontRecord } from "@/lib/services/fonts/to-font-record"
import { TemplateServiceError } from "@/lib/services/templates/errors"
import { requireAuthenticatedUserId } from "@/lib/services/templates/require-user"
import { createClient } from "@/lib/supabase/server"
import {
  MAX_FONT_BYTES,
  type FontRecord,
  type FontStyle,
  type FontWeight,
} from "@/schemas/fonts/font"

type FontFormat = { extension: "ttf" | "otf"; contentType: "font/ttf" | "font/otf" }

function detectFontFormat(bytes: Uint8Array): FontFormat | null {
  if (bytes.length < 4) {
    return null
  }

  const tag = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3])

  if (tag === "OTTO") {
    return { extension: "otf", contentType: "font/otf" }
  }

  if ((bytes[0] === 0 && bytes[1] === 1 && bytes[2] === 0 && bytes[3] === 0) || tag === "true") {
    return { extension: "ttf", contentType: "font/ttf" }
  }

  return null
}

type FontMetadata = { name: string; weight: FontWeight; style: FontStyle }

function readFontMetadata(bytes: Buffer, fileName: string): FontMetadata {
  let parsed: ReturnType<typeof fontkit.create>

  try {
    parsed = fontkit.create(bytes)
  } catch (error) {
    throw new TemplateServiceError(
      "This font file could not be read. Upload a valid .ttf or .otf file.",
      400,
      "INVALID_FONT",
      error instanceof Error ? error.message : undefined
    )
  }

  if ("fonts" in parsed) {
    throw new TemplateServiceError(
      "Font collections (.ttc) are not supported. Upload a single .ttf or .otf file.",
      400,
      "INVALID_FONT"
    )
  }

  const subfamily = parsed.subfamilyName ?? ""
  const os2 = parsed["OS/2"]
  const weightClass = os2?.usWeightClass ?? 400
  const isBold = weightClass >= 600 || /bold|black|heavy|semibold|extrabold/i.test(subfamily)
  const isItalic =
    Boolean(os2?.fsSelection?.italic) ||
    (typeof parsed.italicAngle === "number" && parsed.italicAngle !== 0) ||
    /italic|oblique/i.test(subfamily)

  const fallbackName = fileName.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim()
  const name = (parsed.familyName ?? "").trim() || fallbackName || "Custom font"

  return {
    name: name.slice(0, 80),
    weight: isBold ? 700 : 400,
    style: isItalic ? "italic" : "normal",
  }
}

function escapeLikePattern(value: string): string {
  return value.replace(/[%_\\]/g, "\\$&")
}

/** Uploads a font file and upserts its family/weight/style row; replacing an existing style swaps the file. */
export async function uploadFont(file: File): Promise<FontRecord> {
  const userId = await requireAuthenticatedUserId()

  if (file.size > MAX_FONT_BYTES) {
    throw new TemplateServiceError("Font files must be 5 MB or smaller", 400, "FILE_TOO_LARGE")
  }

  const bytes = Buffer.from(await file.arrayBuffer())
  const format = detectFontFormat(bytes)

  if (!format) {
    logSecurityEvent({
      event: "template.asset.rejected",
      userId,
      code: "INVALID_FONT",
      message: file.type || file.name,
    })
    throw new TemplateServiceError(
      "Upload a .ttf or .otf font file. WOFF and WOFF2 are not supported in PDFs.",
      400,
      "INVALID_FONT"
    )
  }

  const metadata = readFontMetadata(bytes, file.name)
  const supabase = await createClient()
  const storagePath = `${userId}/${randomUUID()}.${format.extension}`

  const { error: uploadError } = await supabase.storage
    .from(FONT_BUCKET)
    .upload(storagePath, bytes, {
      contentType: format.contentType,
      cacheControl: "31536000",
      upsert: false,
    })

  if (uploadError) {
    const lower = uploadError.message.toLowerCase()
    const isMissingBucket = lower.includes("bucket not found") || lower.includes("does not exist")

    throw new TemplateServiceError(
      isMissingBucket
        ? "Font storage is not set up yet. Apply the Supabase migration at supabase/migrations/20261125000000_template_fonts.sql."
        : "Failed to upload font",
      isMissingBucket ? 503 : 500,
      isMissingBucket ? "BUCKET_NOT_FOUND" : "UPLOAD_FAILED",
      uploadError.message
    )
  }

  const { data: existing, error: lookupError } = await supabase
    .from("template_fonts")
    .select("id, storage_path")
    .eq("user_id", userId)
    .ilike("name", escapeLikePattern(metadata.name))
    .eq("weight", metadata.weight)
    .eq("style", metadata.style)
    .maybeSingle()

  if (lookupError) {
    await supabase.storage.from(FONT_BUCKET).remove([storagePath])
    throw mapSupabaseFontError(lookupError, "Failed to save font", "SAVE_FAILED")
  }

  const query = existing
    ? supabase
        .from("template_fonts")
        .update({ name: metadata.name, storage_path: storagePath })
        .eq("id", existing.id)
        .select("*")
        .single()
    : supabase
        .from("template_fonts")
        .insert({
          user_id: userId,
          name: metadata.name,
          weight: metadata.weight,
          style: metadata.style,
          storage_path: storagePath,
        })
        .select("*")
        .single()

  const { data, error } = await query

  if (error || !data) {
    await supabase.storage.from(FONT_BUCKET).remove([storagePath])
    throw mapSupabaseFontError(
      error ?? { message: "No row returned" },
      "Failed to save font",
      "SAVE_FAILED"
    )
  }

  if (existing) {
    await supabase.storage.from(FONT_BUCKET).remove([existing.storage_path])
  }

  return toFontRecord(data)
}
