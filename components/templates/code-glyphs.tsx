"use client"

import { useMemo, type CSSProperties } from "react"

import {
  BARCODE_FORMAT_HINTS,
  BARCODE_FORMAT_LABELS,
  barcodePathData,
  encodeBarcode,
  layoutBarcode,
} from "@/lib/barcodes"
import { createQrMatrix, layoutQr, qrPathData } from "@/lib/templates/qr"
import type { BarcodeElement, QrCodeElement } from "@/schemas/templates/design"

type GlyphProps = {
  style?: CSSProperties
  className?: string
}

function Placeholder({
  label,
  hint,
  style,
  className,
}: GlyphProps & { label: string; hint?: string }) {
  return (
    <div
      style={style}
      className={`flex flex-col items-center justify-center gap-0.5 overflow-hidden border border-dashed border-brand-slate/60 bg-brand-mist/50 px-1 text-center text-brand-slate ${className ?? ""}`}
    >
      <span className="text-[10px] leading-tight font-medium">{label}</span>
      {hint ? <span className="text-[8px] leading-tight opacity-80">{hint}</span> : null}
    </div>
  )
}

/** QR code preview; `value` is the text to encode (already interpolated when previewing data). */
export function QrCodeGlyph({
  element,
  value,
  style,
  className,
}: GlyphProps & { element: QrCodeElement; value: string }) {
  const matrix = useMemo(
    () => createQrMatrix(value, element.errorCorrection),
    [value, element.errorCorrection]
  )

  if (!matrix) {
    return (
      <Placeholder
        label="QR code"
        hint={value ? "Too long to encode" : "Add a value"}
        style={style}
        className={className}
      />
    )
  }

  const layout = layoutQr(matrix, element.width, element.height)
  const bgX = (element.width - layout.span) / 2
  const bgY = (element.height - layout.span) / 2

  return (
    <svg
      viewBox={`0 0 ${element.width} ${element.height}`}
      width="100%"
      height="100%"
      preserveAspectRatio="none"
      style={style}
      className={className}
      aria-hidden
    >
      {element.background ? (
        <rect x={bgX} y={bgY} width={layout.span} height={layout.span} fill={element.background} />
      ) : null}
      <path d={qrPathData(matrix, layout)} fill={element.color} />
    </svg>
  )
}

export function BarcodeGlyph({
  element,
  value,
  style,
  className,
}: GlyphProps & { element: BarcodeElement; value: string }) {
  const encoding = useMemo(() => encodeBarcode(element.format, value), [element.format, value])

  if (!encoding) {
    return (
      <Placeholder
        label={BARCODE_FORMAT_LABELS[element.format]}
        hint={
          value
            ? element.format === "ean13"
              ? "Needs 12 or 13 digits"
              : "Unsupported characters"
            : BARCODE_FORMAT_HINTS[element.format]
        }
        style={style}
        className={className}
      />
    )
  }

  const layout = layoutBarcode(encoding, element.width, element.height, element.showText)

  return (
    <svg
      viewBox={`0 0 ${element.width} ${element.height}`}
      width="100%"
      height="100%"
      preserveAspectRatio="none"
      style={style}
      className={className}
      aria-hidden
    >
      {element.background ? (
        <rect x={0} y={0} width={element.width} height={element.height} fill={element.background} />
      ) : null}
      <path d={barcodePathData(encoding, layout)} fill={element.color} />
      {element.showText ? (
        <text
          x={element.width / 2}
          y={layout.barsHeight + layout.fontSize}
          textAnchor="middle"
          fontFamily="Helvetica, Arial, sans-serif"
          fontSize={layout.fontSize}
          fill={element.color}
        >
          {encoding.text}
        </text>
      ) : null}
    </svg>
  )
}
