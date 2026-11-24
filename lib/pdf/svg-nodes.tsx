import { Circle, Ellipse, Line, Path, Polygon, Polyline, Rect } from "@react-pdf/renderer"
import type { ReactNode } from "react"

import type { IconNode, IconNodeAttributes } from "@/lib/templates/icon-catalog"

type StrokeProps = {
  stroke: string
  strokeWidth: number
  strokeLinecap: "round"
  strokeLinejoin: "round"
  fill: "none"
}

function attr(attrs: IconNodeAttributes, name: string): string | number {
  return attrs[name] ?? 0
}

function optionalAttr(attrs: IconNodeAttributes, name: string): string | number | undefined {
  return attrs[name]
}

/** Renders lucide icon nodes (24 × 24 viewBox) with react-pdf's SVG primitives. */
export function renderPdfIconNodes(node: IconNode, color: string, strokeWidth: number): ReactNode[] {
  const stroke: StrokeProps = {
    stroke: color,
    strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    fill: "none",
  }

  return node.map(([tag, attrs], index) => {
    switch (tag) {
      case "path":
        return <Path key={index} d={String(attr(attrs, "d") ?? "")} {...stroke} />
      case "circle":
        return (
          <Circle
            key={index}
            cx={attr(attrs, "cx")}
            cy={attr(attrs, "cy")}
            r={attr(attrs, "r")}
            {...stroke}
          />
        )
      case "ellipse":
        return (
          <Ellipse
            key={index}
            cx={attr(attrs, "cx")}
            cy={attr(attrs, "cy")}
            rx={attr(attrs, "rx")}
            ry={attr(attrs, "ry")}
            {...stroke}
          />
        )
      case "line":
        return (
          <Line
            key={index}
            x1={attr(attrs, "x1")}
            y1={attr(attrs, "y1")}
            x2={attr(attrs, "x2")}
            y2={attr(attrs, "y2")}
            {...stroke}
          />
        )
      case "polyline":
        return <Polyline key={index} points={String(attr(attrs, "points") ?? "")} {...stroke} />
      case "polygon":
        return <Polygon key={index} points={String(attr(attrs, "points") ?? "")} {...stroke} />
      case "rect":
        return (
          <Rect
            key={index}
            x={attr(attrs, "x")}
            y={attr(attrs, "y")}
            width={attr(attrs, "width")}
            height={attr(attrs, "height")}
            rx={optionalAttr(attrs, "rx")}
            ry={optionalAttr(attrs, "ry")}
            {...stroke}
          />
        )
      default:
        return null
    }
  })
}
