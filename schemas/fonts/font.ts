export const MAX_FONT_BYTES = 5 * 1024 * 1024

export type FontWeight = 400 | 700
export type FontStyle = "normal" | "italic"

/** One uploaded font file. Files that share a `name` form a family (regular / bold / italic). */
export type FontRecord = {
  id: string
  name: string
  weight: FontWeight
  style: FontStyle
  url: string
  created_at: string
}

export type FontsListResponse = {
  data: FontRecord[]
}

export type FontApiResponse = {
  data: FontRecord
}

export type DeleteFontApiResponse = {
  data: { id: string }
}

export function describeFontStyle(font: Pick<FontRecord, "weight" | "style">): string {
  if (font.weight === 700 && font.style === "italic") return "Bold italic"
  if (font.weight === 700) return "Bold"
  if (font.style === "italic") return "Italic"
  return "Regular"
}
