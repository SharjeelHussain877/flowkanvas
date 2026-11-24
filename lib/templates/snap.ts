import type { Box } from "@/lib/templates/design"
import type { DesignPage } from "@/schemas/templates/design"

export type SnapGuide = { axis: "x" | "y"; position: number }

export type SnapTargets = { x: number[]; y: number[] }

/** Page edges and center plus the edges and centers of every other element on the page. */
export function collectSnapTargets(
  page: DesignPage,
  excludeIds: ReadonlySet<string>,
  width: number,
  height: number
): SnapTargets {
  const x = new Set<number>([0, width / 2, width])
  const y = new Set<number>([0, height / 2, height])

  for (const element of page.elements) {
    if (excludeIds.has(element.id)) {
      continue
    }

    x.add(element.x)
    x.add(element.x + element.width / 2)
    x.add(element.x + element.width)
    y.add(element.y)
    y.add(element.y + element.height / 2)
    y.add(element.y + element.height)
  }

  return { x: [...x], y: [...y] }
}

type AxisSnap = { delta: number; position: number } | null

function snapAxis(candidates: number[], targets: number[], threshold: number): AxisSnap {
  let best: AxisSnap = null

  for (const candidate of candidates) {
    for (const target of targets) {
      const delta = target - candidate

      if (Math.abs(delta) <= threshold && (!best || Math.abs(delta) < Math.abs(best.delta))) {
        best = { delta, position: target }
      }
    }
  }

  return best
}

export type SnapMoveResult = { x: number; y: number; guides: SnapGuide[] }

/** Snaps a box being moved so one of its edges or center lands on a target. */
export function snapMove(box: Box, targets: SnapTargets, threshold: number): SnapMoveResult {
  const xSnap = snapAxis([box.x, box.x + box.width / 2, box.x + box.width], targets.x, threshold)
  const ySnap = snapAxis([box.y, box.y + box.height / 2, box.y + box.height], targets.y, threshold)
  const guides: SnapGuide[] = []

  if (xSnap) guides.push({ axis: "x", position: xSnap.position })
  if (ySnap) guides.push({ axis: "y", position: ySnap.position })

  return {
    x: box.x + (xSnap?.delta ?? 0),
    y: box.y + (ySnap?.delta ?? 0),
    guides,
  }
}

export type SnapResizeResult = Box & { guides: SnapGuide[] }

/** Snaps only the edges that a resize handle is dragging. */
export function snapResize(
  box: Box,
  handle: string,
  targets: SnapTargets,
  threshold: number,
  minSize: number
): SnapResizeResult {
  let { x, y, width, height } = box
  const guides: SnapGuide[] = []

  if (handle.includes("e")) {
    const snap = snapAxis([x + width], targets.x, threshold)

    if (snap) {
      width = Math.max(minSize, width + snap.delta)
      guides.push({ axis: "x", position: snap.position })
    }
  }

  if (handle.includes("w")) {
    const snap = snapAxis([x], targets.x, threshold)

    if (snap) {
      const nextWidth = Math.max(minSize, width - snap.delta)
      x = x + width - nextWidth
      width = nextWidth
      guides.push({ axis: "x", position: snap.position })
    }
  }

  if (handle.includes("s")) {
    const snap = snapAxis([y + height], targets.y, threshold)

    if (snap) {
      height = Math.max(minSize, height + snap.delta)
      guides.push({ axis: "y", position: snap.position })
    }
  }

  if (handle.includes("n")) {
    const snap = snapAxis([y], targets.y, threshold)

    if (snap) {
      const nextHeight = Math.max(minSize, height - snap.delta)
      y = y + height - nextHeight
      height = nextHeight
      guides.push({ axis: "y", position: snap.position })
    }
  }

  return { x, y, width, height, guides }
}
