import { CODE128_QUIET_ZONE, encodeCode128 } from "@/lib/barcodes/code128"
import { EAN13_QUIET_ZONE, encodeEan13 } from "@/lib/barcodes/ean13"
import type { BarcodeFormat } from "@/schemas/templates/design"

export type BarcodeEncoding = {
  /** "1" = bar, "0" = space; one character per module. */
  modules: string
  /** Human-readable text printed under the bars. */
  text: string
  quietZone: number
}

export const BARCODE_FORMAT_LABELS: Record<BarcodeFormat, string> = {
  code128: "Code 128",
  ean13: "EAN-13",
}

export const BARCODE_FORMAT_HINTS: Record<BarcodeFormat, string> = {
  code128: "Letters, numbers and symbols (ASCII). Used for SKUs, order and ticket numbers.",
  ean13: "12 or 13 digits. Retail product codes; the check digit is added automatically.",
}

export function encodeBarcode(format: BarcodeFormat, value: string): BarcodeEncoding | null {
  if (format === "ean13") {
    const encoded = encodeEan13(value)
    return encoded ? { modules: encoded.modules, text: encoded.digits, quietZone: EAN13_QUIET_ZONE } : null
  }

  const modules = encodeCode128(value)
  return modules ? { modules, text: value, quietZone: CODE128_QUIET_ZONE } : null
}

export type BarcodeLayout = {
  unit: number
  offsetX: number
  barsHeight: number
  textHeight: number
  fontSize: number
}

/** Fits the modules (plus quiet zones) across the box; reserves space for text when shown. */
export function layoutBarcode(
  encoding: BarcodeEncoding,
  width: number,
  height: number,
  showText: boolean
): BarcodeLayout {
  const totalModules = encoding.modules.length + encoding.quietZone * 2
  const unit = width / totalModules
  const fontSize = Math.max(6, Math.min(14, height * 0.18))
  const textHeight = showText ? fontSize * 1.5 : 0

  return {
    unit,
    offsetX: encoding.quietZone * unit,
    barsHeight: Math.max(1, height - textHeight),
    textHeight,
    fontSize,
  }
}

/** One SVG path with a sub-path per bar run. */
export function barcodePathData(encoding: BarcodeEncoding, layout: BarcodeLayout): string {
  const parts: string[] = []
  const { modules } = encoding
  let index = 0

  while (index < modules.length) {
    if (modules[index] !== "1") {
      index += 1
      continue
    }

    let run = 1

    while (index + run < modules.length && modules[index + run] === "1") {
      run += 1
    }

    const x = round(layout.offsetX + index * layout.unit)
    const w = round(run * layout.unit)

    parts.push(`M${x} 0h${w}v${round(layout.barsHeight)}h-${w}z`)
    index += run
  }

  return parts.join("")
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000
}
