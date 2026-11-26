import { renderTemplatePdf } from "@/lib/pdf/render-template-pdf"
import { logSecurityEvent } from "@/lib/security/audit-log"
import { listFontsForUser } from "@/lib/services/fonts/list-fonts-for-user"
import { logRenderRequest } from "@/lib/services/requests/log-render-request"
import { getAllElements } from "@/lib/templates/design"
import { isCustomFontFamily } from "@/lib/templates/fonts"
import type { FontRecord } from "@/schemas/fonts/font"
import type { RenderRequestSource } from "@/schemas/requests/render-request"
import type { TemplateDesign } from "@/schemas/templates/design"
import type { GenerateRequestPayload } from "@/schemas/templates/generate"
import type { TemplateRecord } from "@/schemas/templates/template"

export type GenerateTemplatePdfResult = {
  bytes: Uint8Array<ArrayBuffer>
  filename: string
  missingVariables: string[]
  warnings: string[]
}

function toPdfFilename(name: string): string {
  const base = name.replace(/[^a-zA-Z0-9-_ ]+/g, "").trim() || "template"
  return `${base.replace(/\s+/g, "-").slice(0, 60)}.pdf`
}

function usesCustomFonts(design: TemplateDesign): boolean {
  return getAllElements(design).some(
    (element) => element.type === "text" && isCustomFontFamily(element.fontFamily)
  )
}

async function loadFonts(design: TemplateDesign, userId: string): Promise<FontRecord[]> {
  if (!usesCustomFonts(design)) {
    return []
  }

  return listFontsForUser(userId)
}

export async function generateTemplatePdf(input: {
  template: TemplateRecord
  userId: string
  payload: GenerateRequestPayload
  source: RenderRequestSource
}): Promise<GenerateTemplatePdfResult> {
  const startedAt = Date.now()

  try {
    const fonts = await loadFonts(input.template.design, input.userId)
    const result = await renderTemplatePdf(
      input.template.design,
      input.payload,
      input.template.name,
      fonts
    )

    await logRenderRequest({
      userId: input.userId,
      templateId: input.template.id,
      templateName: input.template.name,
      status: "success",
      source: input.source,
      durationMs: Date.now() - startedAt,
    })

    return {
      bytes: result.bytes,
      filename: toPdfFilename(input.template.name),
      missingVariables: result.missingVariables,
      warnings: result.warnings,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Render failed"

    logSecurityEvent({
      event: "template.render.failure",
      userId: input.userId,
      code: error instanceof Error && "code" in error ? String(error.code) : null,
      message,
    })

    await logRenderRequest({
      userId: input.userId,
      templateId: input.template.id,
      templateName: input.template.name,
      status: "failed",
      source: input.source,
      durationMs: Date.now() - startedAt,
      error: message,
    })

    throw error
  }
}
