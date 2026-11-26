import { z } from "zod"

export const TEMPLATE_VARIABLE_PATTERN = /\{\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*\}\}/g
export const TEMPLATE_VARIABLE_NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/

export const MIN_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 14400
const MAX_ELEMENTS = 300
export const MAX_PAGES = 30
export const DESIGN_VERSION = 2

const hexColor = z
  .string()
  .regex(/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i, "Use a hex color like #11172a")

const optionalColor = z.union([hexColor, z.literal("")])

const finiteNumber = z.number().finite()

const variableName = z
  .string()
  .regex(TEMPLATE_VARIABLE_NAME_PATTERN, "Use letters, numbers and underscores only")

export const STANDARD_FONT_FAMILIES = ["helvetica", "times", "courier"] as const
export type StandardFontFamily = (typeof STANDARD_FONT_FAMILIES)[number]

/** A standard PDF font id, or `custom:<family name>` for an uploaded font. */
const fontFamilySchema = z.string().min(1).max(120)
const textAlignSchema = z.enum(["left", "center", "right"])
const verticalAlignSchema = z.enum(["top", "middle", "bottom"])
const imageFitSchema = z.enum(["contain", "cover", "fill"])
const shapeKindSchema = z.enum(["rect", "ellipse", "triangle", "star", "diamond", "hexagon"])
const lineOrientationSchema = z.enum([
  "horizontal",
  "vertical",
  "diagonal-down",
  "diagonal-up",
])
const qrErrorCorrectionSchema = z.enum(["L", "M", "Q", "H"])
const barcodeFormatSchema = z.enum(["code128", "ean13"])
const conditionOperatorSchema = z.enum(["set", "empty", "equals", "not_equals"])

/** Show an element only when a payload variable matches. */
const visibilityConditionSchema = z.object({
  variable: variableName,
  operator: conditionOperatorSchema,
  value: z.string().max(500),
})

const elementBase = {
  id: z.string().min(1).max(64),
  x: finiteNumber,
  y: finiteNumber,
  width: finiteNumber.min(1),
  height: finiteNumber.min(1),
}

const elementExtras = {
  condition: visibilityConditionSchema.nullable(),
  group: z.string().min(1).max(64).nullable(),
}

const textFields = {
  type: z.literal("text"),
  text: z.string().max(5000),
  fontSize: finiteNumber.min(4).max(400),
  fontFamily: fontFamilySchema,
  bold: z.boolean(),
  italic: z.boolean(),
  color: hexColor,
  align: textAlignSchema,
  verticalAlign: verticalAlignSchema,
  lineHeight: finiteNumber.min(0.5).max(3),
  /** Shrink the font until long values fit the box (never below 4px). */
  autoFit: z.boolean().default(true),
}

const imageFields = {
  type: z.literal("image"),
  src: z.string().max(2000).nullable(),
  variable: variableName.nullable(),
  fit: imageFitSchema,
  /** Mask the image to this shape; `radius` applies to `rect` only. */
  shape: shapeKindSchema.default("rect"),
  radius: finiteNumber.min(0),
}

const shapeFields = {
  type: z.literal("shape"),
  kind: shapeKindSchema,
  fill: optionalColor,
  stroke: optionalColor,
  strokeWidth: finiteNumber.min(0),
  /** Corner radius for `rect`. */
  radius: finiteNumber.min(0),
}

const textElementSchema = z.object({ ...elementBase, ...elementExtras, ...textFields })
const imageElementSchema = z.object({ ...elementBase, ...elementExtras, ...imageFields })
const shapeElementSchema = z.object({ ...elementBase, ...elementExtras, ...shapeFields })

const lineElementSchema = z.object({
  ...elementBase,
  ...elementExtras,
  type: z.literal("line"),
  stroke: hexColor,
  strokeWidth: finiteNumber.min(0.5).max(100),
  orientation: lineOrientationSchema,
  /** Dash length in px; 0 draws a solid line. */
  dash: finiteNumber.min(0).max(100),
})

const iconElementSchema = z.object({
  ...elementBase,
  ...elementExtras,
  type: z.literal("icon"),
  /** Key in the icon catalog (lib/templates/icon-catalog.ts). */
  name: z.string().min(1).max(64),
  color: hexColor,
  strokeWidth: finiteNumber.min(0.5).max(4),
})

const qrCodeElementSchema = z.object({
  ...elementBase,
  ...elementExtras,
  type: z.literal("qrcode"),
  /** Encoded content; `{{variables}}` are interpolated per PDF. */
  value: z.string().max(2000),
  color: hexColor,
  background: optionalColor,
  errorCorrection: qrErrorCorrectionSchema,
})

const barcodeElementSchema = z.object({
  ...elementBase,
  ...elementExtras,
  type: z.literal("barcode"),
  value: z.string().max(200),
  format: barcodeFormatSchema,
  color: hexColor,
  background: optionalColor,
  showText: z.boolean(),
})

const canonicalElementSchema = z.discriminatedUnion("type", [
  textElementSchema,
  imageElementSchema,
  shapeElementSchema,
  lineElementSchema,
  iconElementSchema,
  qrCodeElementSchema,
  barcodeElementSchema,
])

/** Earlier designs stored rectangles and ellipses as their own element types. */
function upgradeLegacyElement(value: unknown): unknown {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return value
  }

  const element = value as Record<string, unknown>

  if (element.type === "rect" || element.type === "ellipse") {
    const { type, ...rest } = element
    return { ...rest, type: "shape", kind: type, radius: rest.radius ?? 0 }
  }

  return value
}

const designElementSchema = z.preprocess(upgradeLegacyElement, canonicalElementSchema)

const designPageSchema = z.object({
  id: z.string().min(1).max(64),
  background: hexColor,
  elements: z.array(designElementSchema).max(MAX_ELEMENTS),
})

const pageDimension = finiteNumber.min(MIN_PAGE_SIZE).max(MAX_PAGE_SIZE)

const templateDesignV2Schema = z.object({
  version: z.literal(DESIGN_VERSION),
  width: pageDimension,
  height: pageDimension,
  pages: z.array(designPageSchema).min(1).max(MAX_PAGES),
})

/** First design format: a single page with text / image / rect elements and enum fonts. */
const templateDesignV1Schema = z.object({
  version: z.literal(1),
  width: pageDimension,
  height: pageDimension,
  background: hexColor,
  elements: z
    .array(
      z.preprocess(
        upgradeLegacyElement,
        z.discriminatedUnion("type", [
          z.object({ ...elementBase, ...textFields }),
          z.object({ ...elementBase, ...imageFields }),
          z.object({ ...elementBase, ...shapeFields }),
        ])
      )
    )
    .max(MAX_ELEMENTS),
})

type TemplateDesignV1 = z.infer<typeof templateDesignV1Schema>

function migrateDesignV1(design: TemplateDesignV1): TemplateDesign {
  return {
    version: DESIGN_VERSION,
    width: design.width,
    height: design.height,
    pages: [
      {
        id: "page-1",
        background: design.background,
        elements: design.elements.map((element) => ({
          ...element,
          condition: null,
          group: null,
        })),
      },
    ],
  }
}

/** Accepts the current format and transparently upgrades stored v1 designs. */
export const templateDesignSchema = z.union([
  templateDesignV2Schema,
  templateDesignV1Schema.transform(migrateDesignV1),
])

export type FontFamily = z.infer<typeof fontFamilySchema>
export type TextAlign = z.infer<typeof textAlignSchema>
export type VerticalAlign = z.infer<typeof verticalAlignSchema>
export type ImageFit = z.infer<typeof imageFitSchema>
export type ShapeKind = z.infer<typeof shapeKindSchema>
export type LineOrientation = z.infer<typeof lineOrientationSchema>
export type QrErrorCorrection = z.infer<typeof qrErrorCorrectionSchema>
export type BarcodeFormat = z.infer<typeof barcodeFormatSchema>
export type ConditionOperator = z.infer<typeof conditionOperatorSchema>
export type VisibilityCondition = z.infer<typeof visibilityConditionSchema>
export type TextElement = z.infer<typeof textElementSchema>
export type ImageElement = z.infer<typeof imageElementSchema>
export type ShapeElement = z.infer<typeof shapeElementSchema>
export type LineElement = z.infer<typeof lineElementSchema>
export type IconElement = z.infer<typeof iconElementSchema>
export type QrCodeElement = z.infer<typeof qrCodeElementSchema>
export type BarcodeElement = z.infer<typeof barcodeElementSchema>
export type DesignElement = z.infer<typeof canonicalElementSchema>
export type DesignPage = z.infer<typeof designPageSchema>
export type TemplateDesign = z.infer<typeof templateDesignV2Schema>
