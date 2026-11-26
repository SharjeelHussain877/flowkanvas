import type { ShapeKind } from "@/schemas/templates/design"

type Point = [number, number]

export const SHAPE_KIND_LABELS: Record<ShapeKind, string> = {
  rect: "Rectangle",
  ellipse: "Ellipse",
  triangle: "Triangle",
  star: "Star",
  diamond: "Diamond",
  hexagon: "Hexagon",
}

export const SHAPE_KINDS = Object.keys(SHAPE_KIND_LABELS) as ShapeKind[]

/**
 * Polygon outline for the straight-edged shapes, inset so a stroke stays inside the box.
 * Returns null for rect and ellipse, which are drawn natively.
 */
export function shapePolygon(kind: ShapeKind, width: number, height: number, inset = 0): Point[] | null {
  const w = width
  const h = height
  const i = inset

  switch (kind) {
    case "triangle":
      return [
        [w / 2, i],
        [w - i, h - i],
        [i, h - i],
      ]
    case "diamond":
      return [
        [w / 2, i],
        [w - i, h / 2],
        [w / 2, h - i],
        [i, h / 2],
      ]
    case "hexagon":
      return [
        [w * 0.25, i],
        [w * 0.75, i],
        [w - i, h / 2],
        [w * 0.75, h - i],
        [w * 0.25, h - i],
        [i, h / 2],
      ]
    case "star": {
      const cx = w / 2
      const cy = h / 2
      const outerX = w / 2 - i
      const outerY = h / 2 - i
      const innerRatio = 0.4
      const points: Point[] = []

      for (let n = 0; n < 10; n += 1) {
        const angle = -Math.PI / 2 + (n * Math.PI) / 5
        const ratio = n % 2 === 0 ? 1 : innerRatio
        points.push([cx + Math.cos(angle) * outerX * ratio, cy + Math.sin(angle) * outerY * ratio])
      }

      return points
    }
    default:
      return null
  }
}

export function pointsAttribute(points: Point[]): string {
  return points.map(([x, y]) => `${round(x)},${round(y)}`).join(" ")
}

/** CSS `clip-path` for masking an image to a shape in the browser. */
export function shapeClipPath(kind: ShapeKind, width: number, height: number): string | undefined {
  if (kind === "rect") {
    return undefined
  }

  if (kind === "ellipse") {
    return "ellipse(50% 50% at 50% 50%)"
  }

  const points = shapePolygon(kind, width, height)

  if (!points) {
    return undefined
  }

  return `polygon(${points
    .map(([x, y]) => `${round((x / width) * 100)}% ${round((y / height) * 100)}%`)
    .join(", ")})`
}

/** White-on-transparent SVG used as an alpha mask when preparing images for the PDF. */
export function shapeMaskSvg(kind: ShapeKind, width: number, height: number): string {
  const body =
    kind === "ellipse"
      ? `<ellipse cx="${width / 2}" cy="${height / 2}" rx="${width / 2}" ry="${height / 2}" fill="#fff"/>`
      : `<polygon points="${pointsAttribute(shapePolygon(kind, width, height) ?? [])}" fill="#fff"/>`

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`
}

function round(value: number): number {
  return Math.round(value * 100) / 100
}
