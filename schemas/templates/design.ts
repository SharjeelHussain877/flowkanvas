import { z } from "zod"

export const TEMPLATE_VARIABLE_PATTERN = /\{\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*\}\}/g
export const TEMPLATE_VARIABLE_NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/

export const MIN_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 14400
export const MAX_ELEMENTS = 300
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
export const fontFamilySchema = z.string().min(1).max(120)
export const textAlignSchema = z.enum(["left", "center", "right"])
export const verticalAlignSchema = z.enum(["top", "middle", "bottom"])
export const imageFitSchema = z.enum(["contain", "cover", "fill"])
export const lineOrientationSchema = z.enum([
  "horizontal",
  "vertical",
  "diagonal-down",
  "diagonal-up",
])
export const qrErrorCorrectionSchema = z.enum(["L", "M", "Q", "H"])
export const barcodeFormatSchema = z.enum(["code128", "ean13"])
export const conditionOperatorSchema = z.enum(["set", "empty", "equals", "not_equals"])

/** Show an element only when a payload variable matches. */
export const visibilityConditionSchema = z.object({
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
}

const imageFields = {
  type: z.literal("image"),
  src: z.string().max(2000).nullable(),
  variable: variableName.nullable(),
  fit: imageFitSchema,
  radius: finiteNumber.min(0),
}

const rectFields = {
  type: z.literal("rect"),
  fill: optionalColor,
  stroke: optionalColor,
  strokeWidth: finiteNumber.min(0),
  radius: finiteNumber.min(0),
}

export const textElementSchema = z.object({ ...elementBase, ...elementExtras, ...textFields })
export const imageElementSchema = z.object({ ...elementBase, ...elementExtras, ...imageFields })
export const rectElementSchema = z.object({ ...elementBase, ...elementExtras, ...rectFields })

export const ellipseElementSchema = z.object({
  ...elementBase,
  ...elementExtras,
  type: z.literal("ellipse"),
  fill: optionalColor,
  stroke: optionalColor,
  strokeWidth: finiteNumber.min(0),
})

export const lineElementSchema = z.object({
  ...elementBase,
  ...elementExtras,
  type: z.literal("line"),
  stroke: hexColor,
  strokeWidth: finiteNumber.min(0.5).max(100),
  orientation: lineOrientationSchema,
  /** Dash length in px; 0 draws a solid line. */
  dash: finiteNumber.min(0).max(100),
})

export const iconElementSchema = z.object({
  ...elementBase,
  ...elementExtras,
  type: z.literal("icon"),
  /** Key in the icon catalog (lib/templates/icon-catalog.ts). */
  name: z.string().min(1).max(64),
  color: hexColor,
  strokeWidth: finiteNumber.min(0.5).max(4),
})

export const qrCodeElementSchema = z.object({
  ...elementBase,
  ...elementExtras,
  type: z.literal("qrcode"),
  /** Encoded content; `{{variables}}` are interpolated per PDF. */
  value: z.string().max(2000),
  color: hexColor,
  background: optionalColor,
  errorCorrection: qrErrorCorrectionSchema,
})

export const barcodeElementSchema = z.object({
  ...elementBase,
  ...elementExtras,
  type: z.literal("barcode"),
  value: z.string().max(200),
  format: barcodeFormatSchema,
  color: hexColor,
  background: optionalColor,
  showText: z.boolean(),
})

export const designElementSchema = z.discriminatedUnion("type", [
  textElementSchema,
  imageElementSchema,
  rectElementSchema,
  ellipseElementSchema,
  lineElementSchema,
  iconElementSchema,
  qrCodeElementSchema,
  barcodeElementSchema,
])

export const designPageSchema = z.object({
  id: z.string().min(1).max(64),
  background: hexColor,
  elements: z.array(designElementSchema).max(MAX_ELEMENTS),
})

const pageDimension = finiteNumber.min(MIN_PAGE_SIZE).max(MAX_PAGE_SIZE)

export const templateDesignV2Schema = z.object({
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
      z.discriminatedUnion("type", [
        z.object({ ...elementBase, ...textFields }),
        z.object({ ...elementBase, ...imageFields }),
        z.object({ ...elementBase, ...rectFields }),
      ])
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
export type LineOrientation = z.infer<typeof lineOrientationSchema>
export type QrErrorCorrection = z.infer<typeof qrErrorCorrectionSchema>
export type BarcodeFormat = z.infer<typeof barcodeFormatSchema>
export type ConditionOperator = z.infer<typeof conditionOperatorSchema>
export type VisibilityCondition = z.infer<typeof visibilityConditionSchema>
export type TextElement = z.infer<typeof textElementSchema>
export type ImageElement = z.infer<typeof imageElementSchema>
export type RectElement = z.infer<typeof rectElementSchema>
export type EllipseElement = z.infer<typeof ellipseElementSchema>
export type LineElement = z.infer<typeof lineElementSchema>
export type IconElement = z.infer<typeof iconElementSchema>
export type QrCodeElement = z.infer<typeof qrCodeElementSchema>
export type BarcodeElement = z.infer<typeof barcodeElementSchema>
export type DesignElement = z.infer<typeof designElementSchema>
export type DesignElementType = DesignElement["type"]
export type DesignPage = z.infer<typeof designPageSchema>
export type TemplateDesign = z.infer<typeof templateDesignV2Schema>
