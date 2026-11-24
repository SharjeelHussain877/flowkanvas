import type { FontFamily } from "@/schemas/templates/design"

type FontOption = {
  value: FontFamily
  label: string
  /** CSS stack that matches the PDF standard font metrics as closely as browsers allow. */
  cssFamily: string
}

export const fontOptions: FontOption[] = [
  { value: "helvetica", label: "Helvetica", cssFamily: "Helvetica, Arial, sans-serif" },
  { value: "times", label: "Times", cssFamily: '"Times New Roman", Times, serif' },
  { value: "courier", label: "Courier", cssFamily: '"Courier New", Courier, monospace' },
]

export function getCssFontFamily(family: FontFamily): string {
  return fontOptions.find((option) => option.value === family)?.cssFamily ?? fontOptions[0].cssFamily
}

/** Maps a family + style to the PDF standard 14 font name (no embedding required). */
export function getPdfFontName(
  family: FontFamily,
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
