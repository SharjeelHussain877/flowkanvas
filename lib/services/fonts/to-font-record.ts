import { getSupabaseUrl } from "@/lib/env"
import type { FontRecord } from "@/schemas/fonts/font"
import type { TemplateFontRow } from "@/types/supabase"

export const FONT_BUCKET = "template-fonts"

export function fontPublicUrl(storagePath: string): string {
  const encoded = storagePath.split("/").map(encodeURIComponent).join("/")
  return `${getSupabaseUrl().replace(/\/$/, "")}/storage/v1/object/public/${FONT_BUCKET}/${encoded}`
}

export function toFontRecord(row: TemplateFontRow): FontRecord {
  return {
    id: row.id,
    name: row.name,
    weight: row.weight === 700 ? 700 : 400,
    style: row.style === "italic" ? "italic" : "normal",
    url: fontPublicUrl(row.storage_path),
    created_at: row.created_at,
  }
}
