import { z } from "zod"

export const TEMPLATE_VARIABLE_PATTERN = /\{\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*\}\}/g
export const TEMPLATE_VARIABLE_NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/

export const MIN_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 14400
export const MAX_ELEMENTS = 300

const hexColor = z
  .string()
  .regex(/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i, "Use a hex color like #11172a")

const optionalColor = z.union([hexColor, z.literal("")])

const finiteNumber = z.number().finite()

const variableName = z
  .string()
  .regex(TEMPLATE_VARIABLE_NAME_PATTERN, "Use letters, numbers and underscores only")

export const fontFamilySchema = z.enum(["helvetica", "times", "courier"])
export const textAlignSchema = z.enum(["left", "center", "right"])
export const verticalAlignSchema = z.enum(["top", "middle", "bottom"])
export const imageFitSchema = z.enum(["contain", "cover", "fill"])

const elementBase = {
  id: z.string().min(1).max(64),
  x: finiteNumber,
  y: finiteNumber,
  width: finiteNumber.min(1),
  height: finiteNumber.min(1),
}

export const textElementSchema = z.object({
  ...elementBase,
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
})

export const imageElementSchema = z.object({
  ...elementBase,
  type: z.literal("image"),
  src: z.string().max(2000).nullable(),
  variable: variableName.nullable(),
  fit: imageFitSchema,
  radius: finiteNumber.min(0),
})

export const rectElementSchema = z.object({
  ...elementBase,
  type: z.literal("rect"),
  fill: optionalColor,
  stroke: optionalColor,
  strokeWidth: finiteNumber.min(0),
  radius: finiteNumber.min(0),
})

export const designElementSchema = z.discriminatedUnion("type", [
  textElementSchema,
  imageElementSchema,
  rectElementSchema,
])

export const templateDesignSchema = z.object({
  version: z.literal(1),
  width: finiteNumber.min(MIN_PAGE_SIZE).max(MAX_PAGE_SIZE),
  height: finiteNumber.min(MIN_PAGE_SIZE).max(MAX_PAGE_SIZE),
  background: hexColor,
  elements: z.array(designElementSchema).max(MAX_ELEMENTS),
})

export type FontFamily = z.infer<typeof fontFamilySchema>
export type TextAlign = z.infer<typeof textAlignSchema>
export type VerticalAlign = z.infer<typeof verticalAlignSchema>
export type ImageFit = z.infer<typeof imageFitSchema>
export type TextElement = z.infer<typeof textElementSchema>
export type ImageElement = z.infer<typeof imageElementSchema>
export type RectElement = z.infer<typeof rectElementSchema>
export type DesignElement = z.infer<typeof designElementSchema>
export type TemplateDesign = z.infer<typeof templateDesignSchema>
