import { renderToBuffer } from "@react-pdf/renderer"

import { encodeBarcode } from "@/lib/barcodes"
import { registerCustomFonts } from "@/lib/pdf/register-fonts"
import { resolveDesignImages } from "@/lib/pdf/resolve-images"
import { TemplateDocument } from "@/lib/pdf/template-document"
import { TemplateServiceError } from "@/lib/services/templates/errors"
import { isElementVisible } from "@/lib/templates/conditions"
import { getAllElements } from "@/lib/templates/design"
import { getCustomFontName, isCustomFontFamily } from "@/lib/templates/fonts"
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
export function applyVisibility(
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

  const { byElement, warnings } = await resolveDesignImages(
    visibleDesign,
    payload.images,
    payload.values
  )

  warnings.push(...collectContentWarnings(visibleDesign, payload.values, customFamilies))

  try {
    const buffer = await renderToBuffer(
      TemplateDocument({
        design: visibleDesign,
        values: payload.values,
        images: byElement,
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
