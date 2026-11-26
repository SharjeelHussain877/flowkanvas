import { renderToBuffer } from "@react-pdf/renderer"

import { encodeBarcode } from "@/lib/barcodes"
import { maskImageToShape } from "@/lib/pdf/mask-image"
import { createPdfTextMeasurer } from "@/lib/pdf/measure-text"
import { registerCustomFonts } from "@/lib/pdf/register-fonts"
import { resolveDesignImages, type ResolvedImage } from "@/lib/pdf/resolve-images"
import { TemplateDocument, type TextLayout } from "@/lib/pdf/template-document"
import { TemplateServiceError } from "@/lib/services/templates/errors"
import { isElementVisible } from "@/lib/templates/conditions"
import { getAllElements } from "@/lib/templates/design"
import { fitFontSize, measureTextHeight, type MeasureText } from "@/lib/templates/fit-text"
import { getCustomFontName, isCustomFontFamily, resolvePdfFont } from "@/lib/templates/fonts"
import { createQrMatrix } from "@/lib/templates/qr"
import { extractTemplateVariables, interpolateText } from "@/lib/templates/variables"
import type { FontRecord } from "@/schemas/fonts/font"
import type { TemplateDesign } from "@/schemas/templates/design"
import type { GenerateRequestPayload } from "@/schemas/templates/generate"

export type RenderTemplatePdfResult = {
  bytes: Uint8Array<ArrayBuffer>
  missingVariables: string[]
  warnings: string[]
}

/** Drops elements whose visibility condition is not met by this payload. */
function applyVisibility(
  design: TemplateDesign,
  payload: GenerateRequestPayload
): TemplateDesign {
  const imageNames = new Set(Object.keys(payload.images))

  return {
    ...design,
    pages: design.pages.map((page) => ({
      ...page,
      elements: page.elements.filter((element) =>
        isElementVisible(element, payload.values, imageNames)
      ),
    })),
  }
}

function collectContentWarnings(
  design: TemplateDesign,
  values: Record<string, string>,
  customFamilies: ReadonlySet<string>
): string[] {
  const warnings = new Set<string>()

  for (const element of getAllElements(design)) {
    if (element.type === "text" && isCustomFontFamily(element.fontFamily) && !customFamilies.has(element.fontFamily)) {
      warnings.add(
        `Font "${getCustomFontName(element.fontFamily)}" is not uploaded anymore; Helvetica was used instead.`
      )
    }

    if (element.type === "barcode") {
      const value = interpolateText(element.value, values)

      if (value && !encodeBarcode(element.format, value)) {
        warnings.add(
          `"${value}" is not a valid ${element.format === "ean13" ? "EAN-13" : "Code 128"} value; the barcode was left blank.`
        )
      }
    }

    if (element.type === "qrcode") {
      const value = interpolateText(element.value, values)

      if (value && !createQrMatrix(value, element.errorCorrection)) {
        warnings.add("A QR code value was too long to encode and was left blank.")
      }
    }
  }

  return [...warnings]
}

/**
 * Per text element: the auto-fitted font size and the height its container needs.
 * react-pdf drops every line that does not fully fit its container, so containers grow to the
 * text's natural height (the page-clipped frame hides the overflow) instead of losing lines.
 */
async function computeTextLayouts(
  design: TemplateDesign,
  values: Record<string, string>,
  customFamilies: ReadonlySet<string>
): Promise<Map<string, TextLayout>> {
  const layouts = new Map<string, TextLayout>()
  const measurers = new Map<string, Promise<MeasureText | null>>()

  for (const element of getAllElements(design)) {
    if (element.type !== "text") {
      continue
    }

    const font = resolvePdfFont(element.fontFamily, element.bold, element.italic, customFamilies)
    const key = `${font.fontFamily}|${font.fontWeight ?? ""}|${font.fontStyle ?? ""}`
    let pending = measurers.get(key)

    if (!pending) {
      pending = createPdfTextMeasurer(font)
      measurers.set(key, pending)
    }

    const measure = await pending

    if (!measure) {
      continue
    }

    const text = interpolateText(element.text, values)
    const params = { text, width: element.width, lineHeight: element.lineHeight, measure }
    const fontSize = element.autoFit
      ? fitFontSize({ ...params, height: element.height, fontSize: element.fontSize })
      : element.fontSize
    const naturalHeight = measureTextHeight(params, fontSize)
    const safetyMargin = 2 * fontSize * element.lineHeight
    const height =
      naturalHeight <= element.height
        ? element.height
        : Math.min(naturalHeight + safetyMargin, Math.max(element.height, design.height - element.y))

    layouts.set(element.id, { fontSize, height })
  }

  return layouts
}

/** Crops and masks images that use a non-rectangular shape. */
async function maskShapedImages(
  design: TemplateDesign,
  images: Map<string, ResolvedImage>,
  warnings: string[]
): Promise<void> {
  const tasks = getAllElements(design).flatMap((element) => {
    const image = element.type === "image" ? images.get(element.id) : undefined

    if (element.type !== "image" || element.shape === "rect" || !image) {
      return []
    }

    return [
      maskImageToShape(image, element)
        .then((masked) => {
          images.set(element.id, masked)
        })
        .catch((error: unknown) => {
          warnings.push(
            `An image could not be masked to its shape and was placed as a rectangle${
              error instanceof Error ? ` (${error.message})` : ""
            }.`
          )
        }),
    ]
  })

  await Promise.all(tasks)
}

export async function renderTemplatePdf(
  design: TemplateDesign,
  payload: GenerateRequestPayload,
  title: string,
  fonts: FontRecord[] = []
): Promise<RenderTemplatePdfResult> {
  const variables = extractTemplateVariables(design)
  const missingVariables = [
    ...variables.text.filter((name) => !(name in payload.values)),
    ...variables.images.filter(
      (name) => !(name in payload.images) && !payload.values[name]?.trim()
    ),
  ]

  const visibleDesign = applyVisibility(design, payload)
  const customFamilies = registerCustomFonts(fonts)

  const [{ byElement, warnings }, textLayouts] = await Promise.all([
    resolveDesignImages(visibleDesign, payload.images, payload.values),
    computeTextLayouts(visibleDesign, payload.values, customFamilies),
  ])

  await maskShapedImages(visibleDesign, byElement, warnings)
  warnings.push(...collectContentWarnings(visibleDesign, payload.values, customFamilies))

  try {
    const buffer = await renderToBuffer(
      TemplateDocument({
        design: visibleDesign,
        values: payload.values,
        images: byElement,
        textLayouts,
        title,
        customFamilies,
      })
    )

    return {
      bytes: new Uint8Array(buffer),
      missingVariables,
      warnings,
    }
  } catch (error) {
    throw new TemplateServiceError(
      "Could not render the PDF for this template.",
      500,
      "RENDER_FAILED",
      error instanceof Error ? error.message : undefined
    )
  }
}
