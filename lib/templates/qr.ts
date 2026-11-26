import qrcode from "qrcode-generator"

import type { QrErrorCorrection } from "@/schemas/templates/design"

// Encode as UTF-8 so non-ASCII content (names, Urdu, emoji) scans correctly.
// Set explicitly: the library's CJS and ESM builds differ in their default encoder.
const utf8 = new TextEncoder()
qrcode.stringToBytes = (value: string) => Array.from(utf8.encode(value))

export type QrMatrix = {
  size: number
  /** `modules[row][col]` is true for a dark module. */
  modules: boolean[][]
}

/** Returns null for empty content or content too long for a QR code. */
export function createQrMatrix(value: string, errorCorrection: QrErrorCorrection): QrMatrix | null {
  if (!value) {
    return null
  }

  try {
    const code = qrcode(0, errorCorrection)
    code.addData(value, "Byte")
    code.make()

    const size = code.getModuleCount()
    const modules: boolean[][] = []

    for (let row = 0; row < size; row += 1) {
      const line: boolean[] = []

      for (let col = 0; col < size; col += 1) {
        line.push(code.isDark(row, col))
      }

      modules.push(line)
    }

    return { size, modules }
  } catch {
    return null
  }
}

export type QrLayout = {
  moduleSize: number
  offsetX: number
  offsetY: number
  /** Side length of the drawn code including the quiet zone. */
  span: number
}

const QR_QUIET_ZONE_MODULES = 2

/** Fits the code (plus quiet zone) centered inside a box. */
export function layoutQr(matrix: QrMatrix, width: number, height: number): QrLayout {
  const totalModules = matrix.size + QR_QUIET_ZONE_MODULES * 2
  const span = Math.min(width, height)
  const moduleSize = span / totalModules

  return {
    moduleSize,
    offsetX: (width - span) / 2 + QR_QUIET_ZONE_MODULES * moduleSize,
    offsetY: (height - span) / 2 + QR_QUIET_ZONE_MODULES * moduleSize,
    span,
  }
}

/** One SVG path covering every dark module; rows are merged into runs to keep it small. */
export function qrPathData(matrix: QrMatrix, layout: QrLayout): string {
  const parts: string[] = []
  const { moduleSize, offsetX, offsetY } = layout

  for (let row = 0; row < matrix.size; row += 1) {
    let col = 0

    while (col < matrix.size) {
      if (!matrix.modules[row][col]) {
        col += 1
        continue
      }

      let run = 1

      while (col + run < matrix.size && matrix.modules[row][col + run]) {
        run += 1
      }

      const x = round(offsetX + col * moduleSize)
      const y = round(offsetY + row * moduleSize)
      const w = round(run * moduleSize)
      const h = round(moduleSize)

      parts.push(`M${x} ${y}h${w}v${h}h-${w}z`)
      col += run
    }
  }

  return parts.join("")
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000
}
