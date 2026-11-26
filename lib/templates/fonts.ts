import type { FontRecord } from "@/schemas/fonts/font"
import {
  STANDARD_FONT_FAMILIES,
  type FontFamily,
  type StandardFontFamily,
} from "@/schemas/templates/design"

const CUSTOM_FONT_PREFIX = "custom:"
const DEFAULT_FONT_FAMILY: StandardFontFamily = "helvetica"

type StandardFontOption = {
  value: StandardFontFamily
  label: string
  /** CSS stack that matches the PDF standard font metrics as closely as browsers allow. */
  cssFamily: string
}

export const standardFontOptions: StandardFontOption[] = [
  { value: "helvetica", label: "Helvetica", cssFamily: "Helvetica, Arial, sans-serif" },
  { value: "times", label: "Times", cssFamily: '"Times New Roman", Times, serif' },
  { value: "courier", label: "Courier", cssFamily: '"Courier New", Courier, monospace' },
]

export function isStandardFontFamily(family: string): family is StandardFontFamily {
  return (STANDARD_FONT_FAMILIES as readonly string[]).includes(family)
}

export function isCustomFontFamily(family: string): boolean {
  return family.startsWith(CUSTOM_FONT_PREFIX) && family.length > CUSTOM_FONT_PREFIX.length
}

export function toCustomFontFamily(name: string): FontFamily {
  return `${CUSTOM_FONT_PREFIX}${name}`
}

export function getCustomFontName(family: string): string {
  return isCustomFontFamily(family) ? family.slice(CUSTOM_FONT_PREFIX.length) : family
}

export function getCssFontFamily(family: FontFamily): string {
  if (isStandardFontFamily(family)) {
    return (
      standardFontOptions.find((option) => option.value === family)?.cssFamily ??
      standardFontOptions[0].cssFamily
    )
  }

  if (isCustomFontFamily(family)) {
    return `"${family.replace(/"/g, "")}", Helvetica, Arial, sans-serif`
  }

  return standardFontOptions[0].cssFamily
}

/** Maps a standard family + style to the PDF standard 14 font name (no embedding required). */
function getPdfFontName(
  family: StandardFontFamily,
  bold: boolean,
  italic: boolean
): string {
  switch (family) {
    case "times":
      if (bold && italic) return "Times-BoldItalic"
      if (bold) return "Times-Bold"
      if (italic) return "Times-Italic"
      return "Times-Roman"
    case "courier":
      if (bold && italic) return "Courier-BoldOblique"
      if (bold) return "Courier-Bold"
      if (italic) return "Courier-Oblique"
      return "Courier"
    default:
      if (bold && italic) return "Helvetica-BoldOblique"
      if (bold) return "Helvetica-Bold"
      if (italic) return "Helvetica-Oblique"
      return "Helvetica"
  }
}

export type PdfFontStyle = {
  fontFamily: string
  fontWeight?: number
  fontStyle?: "normal" | "italic"
  /** True when the requested custom family is not available and Helvetica was used. */
  fallback: boolean
}

/** Resolves a design font to react-pdf style props; custom fonts must be registered first. */
export function resolvePdfFont(
  family: FontFamily,
  bold: boolean,
  italic: boolean,
  availableCustomFamilies: ReadonlySet<string>
): PdfFontStyle {
  if (isStandardFontFamily(family)) {
    return { fontFamily: getPdfFontName(family, bold, italic), fallback: false }
  }

  if (isCustomFontFamily(family) && availableCustomFamilies.has(family)) {
    return {
      fontFamily: family,
      fontWeight: bold ? 700 : 400,
      fontStyle: italic ? "italic" : "normal",
      fallback: false,
    }
  }

  return { fontFamily: getPdfFontName(DEFAULT_FONT_FAMILY, bold, italic), fallback: true }
}

/** Groups uploaded files into families for pickers. */
export function groupFontFamilies(fonts: FontRecord[]): Array<{ family: string; name: string; fonts: FontRecord[] }> {
  const byName = new Map<string, FontRecord[]>()

  for (const font of fonts) {
    const list = byName.get(font.name) ?? []
    list.push(font)
    byName.set(font.name, list)
  }

  return [...byName.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, list]) => ({ family: toCustomFontFamily(name), name, fonts: list }))
}

function cssString(value: string): string {
  return `"${value.replace(/["\\]/g, "")}"`
}

/** `@font-face` rules so the browser renders uploaded fonts exactly like the PDF will. */
export function buildFontFaceCss(fonts: FontRecord[]): string {
  return fonts
    .map(
      (font) =>
        `@font-face{font-family:${cssString(toCustomFontFamily(font.name))};font-weight:${font.weight};font-style:${font.style};font-display:swap;src:url(${cssString(font.url)});}`
    )
    .join("\n")
}
