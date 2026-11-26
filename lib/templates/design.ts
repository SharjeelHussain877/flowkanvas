import type {
  DesignElement,
  DesignPage,
  TemplateDesign,
} from "@/schemas/templates/design"

export type Box = { x: number; y: number; width: number; height: number }

export function getAllElements(design: TemplateDesign): DesignElement[] {
  return design.pages.flatMap((page) => page.elements)
}

export function findPage(design: TemplateDesign, pageId: string): DesignPage | undefined {
  return design.pages.find((page) => page.id === pageId)
}

export function replacePage(
  design: TemplateDesign,
  pageId: string,
  update: (page: DesignPage) => DesignPage
): TemplateDesign {
  let changed = false

  const pages = design.pages.map((page) => {
    if (page.id !== pageId) {
      return page
    }

    const next = update(page)
    changed = next !== page
    return next
  })

  return changed ? { ...design, pages } : design
}

export function getBounds(elements: readonly Box[]): Box | null {
  if (elements.length === 0) {
    return null
  }

  let left = Infinity
  let top = Infinity
  let right = -Infinity
  let bottom = -Infinity

  for (const element of elements) {
    left = Math.min(left, element.x)
    top = Math.min(top, element.y)
    right = Math.max(right, element.x + element.width)
    bottom = Math.max(bottom, element.y + element.height)
  }

  return { x: left, y: top, width: right - left, height: bottom - top }
}

export function boxesIntersect(a: Box, b: Box): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  )
}

/** Selecting any member of a group selects the whole group. */
export function expandGroupSelection(page: DesignPage, ids: readonly string[]): string[] {
  const groups = new Set<string>()
  const selected = new Set(ids)

  for (const element of page.elements) {
    if (selected.has(element.id) && element.group) {
      groups.add(element.group)
    }
  }

  if (groups.size === 0) {
    return [...selected]
  }

  for (const element of page.elements) {
    if (element.group && groups.has(element.group)) {
      selected.add(element.id)
    }
  }

  return [...selected]
}

export const ELEMENT_TYPE_LABELS: Record<DesignElement["type"], string> = {
  text: "Text",
  image: "Image",
  shape: "Shape",
  line: "Line",
  icon: "Icon",
  qrcode: "QR code",
  barcode: "Barcode",
}
