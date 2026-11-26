"use client"

import { EyeOff, ImageIcon } from "lucide-react"
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react"

import { BarcodeGlyph, QrCodeGlyph } from "@/components/templates/code-glyphs"
import { fittedFontSize } from "@/components/templates/fitted-font-size"
import { IconGlyph } from "@/components/templates/icon-glyph"
import { describeCondition } from "@/lib/templates/conditions"
import { getCssFontFamily } from "@/lib/templates/fonts"
import { pointsAttribute, shapeClipPath, shapePolygon } from "@/lib/templates/shapes"
import { tokenizeText } from "@/lib/templates/variables"
import type {
  DesignElement,
  DesignPage as DesignPageData,
  LineElement,
  ShapeElement,
  TemplateDesign,
  TextElement,
} from "@/schemas/templates/design"
import { cn } from "@/lib/utils"

const VERTICAL_ALIGN: Record<TextElement["verticalAlign"], CSSProperties["justifyContent"]> = {
  top: "flex-start",
  middle: "center",
  bottom: "flex-end",
}

function elementBoxStyle(element: DesignElement): CSSProperties {
  return {
    position: "absolute",
    left: element.x,
    top: element.y,
    width: element.width,
    height: element.height,
  }
}

export function textStyle(element: TextElement, fontSize = element.fontSize): CSSProperties {
  return {
    fontFamily: getCssFontFamily(element.fontFamily),
    fontSize,
    lineHeight: element.lineHeight,
    color: element.color,
    textAlign: element.align,
    fontWeight: element.bold ? 700 : 400,
    fontStyle: element.italic ? "italic" : "normal",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    margin: 0,
  }
}

function lineEndpoints(element: LineElement) {
  const { width: w, height: h } = element

  switch (element.orientation) {
    case "vertical":
      return { x1: w / 2, y1: 0, x2: w / 2, y2: h }
    case "diagonal-down":
      return { x1: 0, y1: 0, x2: w, y2: h }
    case "diagonal-up":
      return { x1: 0, y1: h, x2: w, y2: 0 }
    default:
      return { x1: 0, y1: h / 2, x2: w, y2: h / 2 }
  }
}

function ShapeView({ element, box, fill }: { element: ShapeElement; box: CSSProperties; fill: boolean }) {
  const hasStroke = Boolean(element.stroke) && element.strokeWidth > 0
  const polygon = shapePolygon(element.kind, element.width, element.height, hasStroke ? element.strokeWidth / 2 : 0)

  if (!polygon) {
    return (
      <div
        style={{
          ...box,
          boxSizing: "border-box",
          backgroundColor: element.fill || "transparent",
          border: hasStroke ? `${element.strokeWidth}px solid ${element.stroke}` : undefined,
          borderRadius: element.kind === "ellipse" ? "50%" : element.radius,
        }}
      />
    )
  }

  return (
    <svg
      style={box}
      viewBox={`0 0 ${element.width} ${element.height}`}
      width={fill ? "100%" : element.width}
      height={fill ? "100%" : element.height}
      preserveAspectRatio="none"
      aria-hidden
    >
      <polygon
        points={pointsAttribute(polygon)}
        fill={element.fill || "none"}
        stroke={hasStroke ? element.stroke : "none"}
        strokeWidth={element.strokeWidth}
        strokeLinejoin="round"
      />
    </svg>
  )
}

type DesignElementViewProps = {
  element: DesignElement
  highlightVariables?: boolean
  /** Positioned by a parent wrapper (editor) instead of absolutely by itself. */
  fill?: boolean
}

export function DesignElementView({
  element,
  highlightVariables = false,
  fill = false,
}: DesignElementViewProps) {
  const box: CSSProperties = fill
    ? { position: "absolute", inset: 0 }
    : elementBoxStyle(element)

  switch (element.type) {
    case "text": {
      const tokens = highlightVariables ? tokenizeText(element.text) : null

      return (
        <div
          style={{
            ...box,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            justifyContent: VERTICAL_ALIGN[element.verticalAlign],
          }}
        >
          <p style={textStyle(element, fittedFontSize(element))}>
            {tokens
              ? tokens.map((token, index) =>
                  token.kind === "variable" ? (
                    <span
                      key={index}
                      className="rounded-[3px] bg-brand-teal/15 box-decoration-clone"
                    >
                      {token.raw}
                    </span>
                  ) : (
                    <span key={index}>{token.value}</span>
                  )
                )
              : element.text}
          </p>
        </div>
      )
    }

    case "image": {
      const clipPath = shapeClipPath(element.shape, element.width, element.height)
      const radius = element.shape === "rect" ? element.radius : 0

      if (element.src) {
        return (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={element.src}
            alt=""
            draggable={false}
            style={{
              ...box,
              objectFit: element.fit,
              borderRadius: radius,
              clipPath,
              display: "block",
            }}
          />
        )
      }

      return (
        <div
          style={{ ...box, borderRadius: radius, clipPath }}
          className="flex flex-col items-center justify-center gap-1 overflow-hidden border border-dashed border-brand-slate/60 bg-brand-mist/50 text-brand-slate"
        >
          <ImageIcon className="size-6 shrink-0 opacity-70" aria-hidden />
          <span className="max-w-full truncate px-2 text-center text-[11px] leading-tight">
            {element.variable ? `{{${element.variable}}}` : "Image"}
          </span>
        </div>
      )
    }

    case "shape":
      return <ShapeView element={element} box={box} fill={fill} />

    case "line": {
      const points = lineEndpoints(element)

      return (
        <svg
          style={box}
          viewBox={`0 0 ${element.width} ${element.height}`}
          width={fill ? "100%" : element.width}
          height={fill ? "100%" : element.height}
          preserveAspectRatio="none"
          aria-hidden
        >
          <line
            {...points}
            stroke={element.stroke}
            strokeWidth={element.strokeWidth}
            strokeDasharray={element.dash > 0 ? `${element.dash} ${element.dash}` : undefined}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      )
    }

    case "icon":
      return (
        <div style={box}>
          <IconGlyph name={element.name} color={element.color} strokeWidth={element.strokeWidth} />
        </div>
      )

    case "qrcode":
      return <QrCodeGlyph element={element} value={element.value} style={box} />

    case "barcode":
      return <BarcodeGlyph element={element} value={element.value} style={box} />

    default:
      return null
  }
}

/** Small marker shown on conditional elements in editor previews. */
export function ConditionBadge({ element, scale }: { element: DesignElement; scale: number }) {
  if (!element.condition) {
    return null
  }

  const size = 16 / scale

  return (
    <div
      title={describeCondition(element.condition)}
      className="pointer-events-none absolute flex items-center justify-center rounded-full bg-amber-500 text-white shadow-sm"
      style={{
        right: -size / 2,
        top: -size / 2,
        width: size,
        height: size,
      }}
    >
      <EyeOff style={{ width: size * 0.62, height: size * 0.62 }} aria-hidden />
    </div>
  )
}

type DesignPageProps = {
  design: TemplateDesign
  page: DesignPageData
  scale: number
  highlightVariables?: boolean
  renderElement?: (element: DesignElement) => ReactNode
  children?: ReactNode
  className?: string
  onBackgroundPointerDown?: (event: React.PointerEvent<HTMLDivElement>) => void
}

/** One page at a given zoom. Children render in unscaled design units. */
export function DesignPage({
  design,
  page,
  scale,
  highlightVariables = false,
  renderElement,
  children,
  className,
  onBackgroundPointerDown,
}: DesignPageProps) {
  return (
    <div
      className={cn("relative overflow-hidden shadow-md", className)}
      style={{ width: design.width * scale, height: design.height * scale }}
    >
      <div
        data-design-page
        onPointerDown={(event) => {
          if (event.target === event.currentTarget) {
            onBackgroundPointerDown?.(event)
          }
        }}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: design.width,
          height: design.height,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          backgroundColor: page.background,
        }}
      >
        {page.elements.map((element) =>
          renderElement ? (
            renderElement(element)
          ) : (
            <DesignElementView
              key={element.id}
              element={element}
              highlightVariables={highlightVariables}
            />
          )
        )}
        {children}
      </div>
    </div>
  )
}

type DesignPreviewProps = {
  design: TemplateDesign
  /** Which page to show; defaults to the first. */
  pageIndex?: number
  className?: string
  highlightVariables?: boolean
}

/** Fits one page inside its container (template cards, page thumbnails, starters). */
export function DesignPreview({
  design,
  pageIndex = 0,
  className,
  highlightVariables = true,
}: DesignPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0)
  const page = design.pages[pageIndex] ?? design.pages[0]

  useEffect(() => {
    const node = containerRef.current

    if (!node) {
      return
    }

    const update = () => {
      const rect = node.getBoundingClientRect()
      const next = Math.min(rect.width / design.width, rect.height / design.height)
      setScale(Number.isFinite(next) && next > 0 ? next : 0)
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(node)

    return () => observer.disconnect()
  }, [design.width, design.height])

  return (
    <div
      ref={containerRef}
      className={cn("flex items-center justify-center overflow-hidden", className)}
    >
      {scale > 0 && page ? (
        <DesignPage
          design={design}
          page={page}
          scale={scale}
          highlightVariables={highlightVariables}
          className="shadow-sm"
        />
      ) : null}
    </div>
  )
}
