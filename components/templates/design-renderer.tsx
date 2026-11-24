"use client"

import { ImageIcon } from "lucide-react"
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react"

import { getCssFontFamily } from "@/lib/templates/fonts"
import { tokenizeText } from "@/lib/templates/variables"
import type {
  DesignElement,
  TemplateDesign,
  TextElement,
} from "@/schemas/templates/design"
import { cn } from "@/lib/utils"

const VERTICAL_ALIGN: Record<TextElement["verticalAlign"], CSSProperties["justifyContent"]> = {
  top: "flex-start",
  middle: "center",
  bottom: "flex-end",
}

export function elementBoxStyle(element: DesignElement): CSSProperties {
  return {
    position: "absolute",
    left: element.x,
    top: element.y,
    width: element.width,
    height: element.height,
  }
}

export function textStyle(element: TextElement): CSSProperties {
  return {
    fontFamily: getCssFontFamily(element.fontFamily),
    fontSize: element.fontSize,
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
          <p style={textStyle(element)}>
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
              borderRadius: element.radius,
              display: "block",
            }}
          />
        )
      }

      return (
        <div
          style={{ ...box, borderRadius: element.radius }}
          className="flex flex-col items-center justify-center gap-1 overflow-hidden border border-dashed border-brand-slate/60 bg-brand-mist/50 text-brand-slate"
        >
          <ImageIcon className="size-6 shrink-0 opacity-70" aria-hidden />
          <span className="max-w-full truncate px-2 text-center text-[11px] leading-tight">
            {element.variable ? `{{${element.variable}}}` : "Image"}
          </span>
        </div>
      )
    }

    case "rect":
      return (
        <div
          style={{
            ...box,
            boxSizing: "border-box",
            backgroundColor: element.fill || "transparent",
            border:
              element.stroke && element.strokeWidth > 0
                ? `${element.strokeWidth}px solid ${element.stroke}`
                : undefined,
            borderRadius: element.radius,
          }}
        />
      )

    default:
      return null
  }
}

type DesignPageProps = {
  design: TemplateDesign
  scale: number
  highlightVariables?: boolean
  renderElement?: (element: DesignElement) => ReactNode
  children?: ReactNode
  className?: string
  onBackgroundPointerDown?: () => void
}

/** The page at a given zoom. Children render in unscaled design units. */
export function DesignPage({
  design,
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
            onBackgroundPointerDown?.()
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
          backgroundColor: design.background,
        }}
      >
        {design.elements.map((element) =>
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
  className?: string
}

/** Fits the whole page inside its container (used by template cards). */
export function DesignPreview({ design, className }: DesignPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0)

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
      {scale > 0 ? (
        <DesignPage design={design} scale={scale} highlightVariables className="shadow-sm" />
      ) : null}
    </div>
  )
}
