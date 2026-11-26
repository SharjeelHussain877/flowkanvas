import { Font } from "@react-pdf/renderer"

import type { MeasureText } from "@/lib/templates/fit-text"
import type { PdfFontStyle } from "@/lib/templates/fonts"

type LoadedFont = {
  unitsPerEm: number
  layout: (text: string) => { advanceWidth: number }
}

/**
 * Measures text with the same font data react-pdf renders with, so auto-fit sizes
 * match the PDF. Returns null when the font cannot be loaded.
 */
export async function createPdfTextMeasurer(font: PdfFontStyle): Promise<MeasureText | null> {
  try {
    const source = Font.getFont({
      fontFamily: font.fontFamily,
      fontWeight: font.fontWeight ?? 400,
      fontStyle: font.fontStyle ?? "normal",
    })

    await source.load()
    const data = source.data as LoadedFont | null

    if (!data || typeof data.layout !== "function" || !data.unitsPerEm) {
      return null
    }

    const cache = new Map<string, number>()

    return (text, fontSize) => {
      let units = cache.get(text)

      if (units === undefined) {
        units = data.layout(text).advanceWidth
        cache.set(text, units)
      }

      return (units / data.unitsPerEm) * fontSize
    }
  } catch {
    return null
  }
}
