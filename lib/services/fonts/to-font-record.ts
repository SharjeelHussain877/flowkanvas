import { storagePublicUrl } from "@/lib/supabase/public-url"
import type { FontRecord } from "@/schemas/fonts/font"
import type { TemplateFontRow } from "@/types/supabase"

export const FONT_BUCKET = "template-fonts"

export function toFontRecord(row: TemplateFontRow): FontRecord {
  return {
    id: row.id,
    name: row.name,
    weight: row.weight === 700 ? 700 : 400,
    style: row.style === "italic" ? "italic" : "normal",
    url: storagePublicUrl(FONT_BUCKET, row.storage_path),
    created_at: row.created_at,
  }
}
