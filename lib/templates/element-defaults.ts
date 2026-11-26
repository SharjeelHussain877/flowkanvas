import { createElementId, createPageId } from "@/lib/templates/ids"
import type {
  BarcodeElement,
  DesignElement,
  DesignPage,
  IconElement,
  ImageElement,
  LineElement,
  QrCodeElement,
  ShapeElement,
  ShapeKind,
  TemplateDesign,
  TextElement,
} from "@/schemas/templates/design"
import { DESIGN_VERSION } from "@/schemas/templates/design"

export type ToolKind = "text" | "variable" | "line" | "icon" | "qrcode" | "barcode"

export function createEmptyPage(background = "#ffffff"): DesignPage {
  return { id: createPageId(), background, elements: [] }
}

export function createEmptyDesign(width: number, height: number): TemplateDesign {
  return {
    version: DESIGN_VERSION,
    width,
    height,
    pages: [createEmptyPage()],
  }
}

const extras = { condition: null, group: null } as const

function centeredBox(design: TemplateDesign, width: number, height: number) {
  const w = Math.min(width, design.width - 20)
  const h = Math.min(height, design.height - 20)

  return {
    x: Math.round((design.width - w) / 2),
    y: Math.round((design.height - h) / 2),
    width: Math.max(10, w),
    height: Math.max(10, h),
  }
}

export function createTextElement(
  design: TemplateDesign,
  overrides: Partial<TextElement> = {}
): TextElement {
  return {
    id: createElementId(),
    type: "text",
    ...extras,
    ...centeredBox(design, Math.min(320, design.width * 0.6), 48),
    text: "Double-click to edit",
    fontSize: 24,
    fontFamily: "helvetica",
    bold: false,
    italic: false,
    color: "#11172a",
    align: "left",
    verticalAlign: "top",
    lineHeight: 1.2,
    autoFit: true,
    ...overrides,
  }
}

function createVariableTextElement(
  design: TemplateDesign,
  name = "name"
): TextElement {
  return createTextElement(design, {
    text: `{{${name}}}`,
    bold: true,
    align: "center",
  })
}

export function createImageElement(
  design: TemplateDesign,
  overrides: Partial<ImageElement> = {}
): ImageElement {
  return {
    id: createElementId(),
    type: "image",
    ...extras,
    ...centeredBox(design, Math.min(200, design.width * 0.4), Math.min(200, design.height * 0.4)),
    src: null,
    variable: null,
    fit: "cover",
    shape: "rect",
    radius: 0,
    ...overrides,
  }
}

/** Places an image from the library at a size that keeps its aspect ratio inside the page. */
export function createImageElementForAsset(
  design: TemplateDesign,
  src: string,
  naturalWidth: number,
  naturalHeight: number
): ImageElement {
  const maxWidth = design.width * 0.5
  const maxHeight = design.height * 0.5
  const ratio = naturalWidth > 0 && naturalHeight > 0 ? naturalWidth / naturalHeight : 1
  let width = Math.min(maxWidth, naturalWidth || maxWidth)
  let height = width / ratio

  if (height > maxHeight) {
    height = maxHeight
    width = height * ratio
  }

  return createImageElement(design, {
    ...centeredBox(design, Math.round(width), Math.round(height)),
    src,
  })
}

export function createShapeElement(
  design: TemplateDesign,
  kind: ShapeKind,
  overrides: Partial<ShapeElement> = {}
): ShapeElement {
  const isRect = kind === "rect"
  const size = Math.min(160, design.width * 0.4, design.height * 0.4)

  return {
    id: createElementId(),
    type: "shape",
    ...extras,
    ...(isRect
      ? centeredBox(design, Math.min(240, design.width * 0.5), Math.min(120, design.height * 0.3))
      : centeredBox(design, size, size)),
    kind,
    fill: isRect ? "#599692" : "#dfe5ec",
    stroke: isRect ? "" : "#599692",
    strokeWidth: isRect ? 0 : 3,
    radius: isRect ? 8 : 0,
    ...overrides,
  }
}

export function createLineElement(
  design: TemplateDesign,
  overrides: Partial<LineElement> = {}
): LineElement {
  return {
    id: createElementId(),
    type: "line",
    ...extras,
    ...centeredBox(design, Math.min(280, design.width * 0.6), 12),
    stroke: "#11172a",
    strokeWidth: 2,
    orientation: "horizontal",
    dash: 0,
    ...overrides,
  }
}

export function createIconElement(
  design: TemplateDesign,
  overrides: Partial<IconElement> = {}
): IconElement {
  const size = Math.min(64, design.width * 0.3, design.height * 0.3)

  return {
    id: createElementId(),
    type: "icon",
    ...extras,
    ...centeredBox(design, size, size),
    name: "star",
    color: "#599692",
    strokeWidth: 2,
    ...overrides,
  }
}

export function createQrCodeElement(
  design: TemplateDesign,
  overrides: Partial<QrCodeElement> = {}
): QrCodeElement {
  const size = Math.min(120, design.width * 0.4, design.height * 0.4)

  return {
    id: createElementId(),
    type: "qrcode",
    ...extras,
    ...centeredBox(design, size, size),
    value: "https://example.com/{{code}}",
    color: "#11172a",
    background: "#ffffff",
    errorCorrection: "M",
    ...overrides,
  }
}

export function createBarcodeElement(
  design: TemplateDesign,
  overrides: Partial<BarcodeElement> = {}
): BarcodeElement {
  return {
    id: createElementId(),
    type: "barcode",
    ...extras,
    ...centeredBox(design, Math.min(220, design.width * 0.6), Math.min(80, design.height * 0.3)),
    value: "{{sku}}",
    format: "code128",
    color: "#11172a",
    background: "#ffffff",
    showText: true,
    ...overrides,
  }
}

export function createElementForTool(design: TemplateDesign, kind: ToolKind): DesignElement {
  switch (kind) {
    case "variable":
      return createVariableTextElement(design)
    case "line":
      return createLineElement(design)
    case "icon":
      return createIconElement(design)
    case "qrcode":
      return createQrCodeElement(design)
    case "barcode":
      return createBarcodeElement(design)
    default:
      return createTextElement(design)
  }
}

function duplicateElement(element: DesignElement, offset = 16): DesignElement {
  return {
    ...element,
    id: createElementId(),
    x: element.x + offset,
    y: element.y + offset,
  }
}

/** Copies elements together; grouped elements keep their grouping under a new group id. */
export function duplicateElements(elements: DesignElement[], offset = 16): DesignElement[] {
  const groupIds = new Map<string, string>()

  return elements.map((element) => {
    const copy = duplicateElement(element, offset)

    if (element.group) {
      let next = groupIds.get(element.group)

      if (!next) {
        next = `group-${createElementId()}`
        groupIds.set(element.group, next)
      }

      return { ...copy, group: next }
    }

    return copy
  })
}
