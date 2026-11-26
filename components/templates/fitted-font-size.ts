"use client"

import { fitFontSize } from "@/lib/templates/fit-text"
import { getCssFontFamily } from "@/lib/templates/fonts"
import type { TextElement } from "@/schemas/templates/design"

let context: CanvasRenderingContext2D | null | undefined

function getContext(): CanvasRenderingContext2D | null {
  if (context === undefined) {
    context = typeof document === "undefined" ? null : document.createElement("canvas").getContext("2d")
  }

  return context
}

/**
 * Browser-side auto-fit using canvas text metrics with the element's CSS font, so the
 * preview shrinks long text the same way the PDF renderer does.
 */
export function fittedFontSize(element: TextElement, text = element.text): number {
  const ctx = getContext()

  if (!element.autoFit || !ctx) {
    return element.fontSize
  }

  const family = getCssFontFamily(element.fontFamily)
  const style = element.italic ? "italic " : ""
  const weight = element.bold ? 700 : 400

  return fitFontSize({
    text,
    width: element.width,
    height: element.height,
    fontSize: element.fontSize,
    lineHeight: element.lineHeight,
    measure: (value, size) => {
      ctx.font = `${style}${weight} ${size}px ${family}`
      return ctx.measureText(value).width
    },
  })
}
