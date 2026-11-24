import { createElement, type CSSProperties } from "react"

import { iconCatalog, type IconNode } from "@/lib/templates/icon-catalog"

type IconGlyphProps = {
  name: string
  color?: string
  strokeWidth?: number
  className?: string
  style?: CSSProperties
}

/** Renders a catalog icon as inline SVG - the same paths the PDF renderer draws. */
export function IconGlyph({
  name,
  color = "currentColor",
  strokeWidth = 2,
  className,
  style,
}: IconGlyphProps) {
  const node: IconNode | undefined = iconCatalog[name]

  if (!node) {
    return null
  }

  return (
    <svg
      viewBox="0 0 24 24"
      width="100%"
      height="100%"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden
    >
      {node.map(([tag, attrs], index) => createElement(tag, { key: index, ...attrs }))}
    </svg>
  )
}
