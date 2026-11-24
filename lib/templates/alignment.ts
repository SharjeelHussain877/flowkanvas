import { getBounds, type Box } from "@/lib/templates/design"
import type { DesignElement } from "@/schemas/templates/design"

export type AlignMode = "left" | "center" | "right" | "top" | "middle" | "bottom"
export type DistributeAxis = "horizontal" | "vertical"

export type PositionPatch = { id: string; patch: { x?: number; y?: number } }

export const ALIGN_MODE_LABELS: Record<AlignMode, string> = {
  left: "Align left",
  center: "Align horizontal center",
  right: "Align right",
  top: "Align top",
  middle: "Align vertical center",
  bottom: "Align bottom",
}

/** Moves each element so the chosen edge/center matches the reference box. */
export function alignElements(
  elements: DesignElement[],
  mode: AlignMode,
  reference: Box
): PositionPatch[] {
  return elements.map((element) => {
    switch (mode) {
      case "left":
        return { id: element.id, patch: { x: Math.round(reference.x) } }
      case "center":
        return {
          id: element.id,
          patch: { x: Math.round(reference.x + (reference.width - element.width) / 2) },
        }
      case "right":
        return { id: element.id, patch: { x: Math.round(reference.x + reference.width - element.width) } }
      case "top":
        return { id: element.id, patch: { y: Math.round(reference.y) } }
      case "middle":
        return {
          id: element.id,
          patch: { y: Math.round(reference.y + (reference.height - element.height) / 2) },
        }
      case "bottom":
        return { id: element.id, patch: { y: Math.round(reference.y + reference.height - element.height) } }
      default:
        return { id: element.id, patch: {} }
    }
  })
}

/** Spaces three or more elements evenly between the outermost two. */
export function distributeElements(
  elements: DesignElement[],
  axis: DistributeAxis
): PositionPatch[] {
  if (elements.length < 3) {
    return []
  }

  const bounds = getBounds(elements)

  if (!bounds) {
    return []
  }

  const sorted = [...elements].sort((a, b) => (axis === "horizontal" ? a.x - b.x : a.y - b.y))
  const totalSize = sorted.reduce(
    (sum, element) => sum + (axis === "horizontal" ? element.width : element.height),
    0
  )
  const span = axis === "horizontal" ? bounds.width : bounds.height
  const gap = (span - totalSize) / (sorted.length - 1)
  let cursor = axis === "horizontal" ? bounds.x : bounds.y

  return sorted.map((element) => {
    const position = Math.round(cursor)
    cursor += (axis === "horizontal" ? element.width : element.height) + gap

    return {
      id: element.id,
      patch: axis === "horizontal" ? { x: position } : { y: position },
    }
  })
}
