import type {
  DesignElement,
  ImageElement,
  RectElement,
  TemplateDesign,
  TextElement,
} from "@/schemas/templates/design"

export function createElementId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().slice(0, 8)
  }

  return Math.random().toString(36).slice(2, 10)
}

export function createEmptyDesign(width: number, height: number): TemplateDesign {
  return {
    version: 1,
    width,
    height,
    background: "#ffffff",
    elements: [],
  }
}

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
    ...overrides,
  }
}

export function createVariableTextElement(
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
    ...centeredBox(design, Math.min(200, design.width * 0.4), Math.min(200, design.height * 0.4)),
    src: null,
    variable: null,
    fit: "contain",
    radius: 0,
    ...overrides,
  }
}

export function createRectElement(
  design: TemplateDesign,
  overrides: Partial<RectElement> = {}
): RectElement {
  return {
    id: createElementId(),
    type: "rect",
    ...centeredBox(design, Math.min(240, design.width * 0.5), Math.min(120, design.height * 0.3)),
    fill: "#599692",
    stroke: "",
    strokeWidth: 0,
    radius: 8,
    ...overrides,
  }
}

export function duplicateElement(element: DesignElement): DesignElement {
  return {
    ...element,
    id: createElementId(),
    x: element.x + 16,
    y: element.y + 16,
  }
}
