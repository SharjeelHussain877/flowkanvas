import { z } from "zod"

export const MAX_FONT_BYTES = 5 * 1024 * 1024
export const FONT_FILE_EXTENSIONS = [".ttf", ".otf"] as const

export const fontWeightSchema = z.union([z.literal(400), z.literal(700)])
export const fontStyleSchema = z.enum(["normal", "italic"])

export type FontWeight = z.infer<typeof fontWeightSchema>
export type FontStyle = z.infer<typeof fontStyleSchema>

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
