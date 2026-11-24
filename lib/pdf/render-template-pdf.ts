import { renderToBuffer } from "@react-pdf/renderer"

import { resolveDesignImages } from "@/lib/pdf/resolve-images"
import { TemplateDocument } from "@/lib/pdf/template-document"
import { TemplateServiceError } from "@/lib/services/templates/errors"
import { extractTemplateVariables } from "@/lib/templates/variables"
import type { TemplateDesign } from "@/schemas/templates/design"
import type { GenerateRequestPayload } from "@/schemas/templates/generate"

export type RenderTemplatePdfResult = {
  bytes: Uint8Array<ArrayBuffer>
  missingVariables: string[]
  warnings: string[]
}

export async function renderTemplatePdf(
  design: TemplateDesign,
  payload: GenerateRequestPayload,
  title: string
): Promise<RenderTemplatePdfResult> {
  const variables = extractTemplateVariables(design)
  const missingVariables = [
    ...variables.text.filter((name) => !(name in payload.values)),
    ...variables.images.filter(
      (name) => !(name in payload.images) && !payload.values[name]?.trim()
    ),
  ]

  const { byElement, warnings } = await resolveDesignImages(
    design,
    payload.images,
    payload.values
  )

  try {
    const buffer = await renderToBuffer(
      TemplateDocument({ design, values: payload.values, images: byElement, title })
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
