import { renderTemplatePdf } from "@/lib/pdf/render-template-pdf"
import { logSecurityEvent } from "@/lib/security/audit-log"
import { logRenderRequest } from "@/lib/services/requests/log-render-request"
import type { RenderRequestSource } from "@/schemas/requests/render-request"
import type { GenerateRequestPayload } from "@/schemas/templates/generate"
import type { TemplateRecord } from "@/schemas/templates/template"

export type GenerateTemplatePdfResult = {
  bytes: Uint8Array<ArrayBuffer>
  filename: string
  missingVariables: string[]
  warnings: string[]
}

export function toPdfFilename(name: string): string {
  const base = name.replace(/[^a-zA-Z0-9-_ ]+/g, "").trim() || "template"
  return `${base.replace(/\s+/g, "-").slice(0, 60)}.pdf`
}

export async function generateTemplatePdf(input: {
  template: TemplateRecord
  userId: string
  payload: GenerateRequestPayload
  source: RenderRequestSource
}): Promise<GenerateTemplatePdfResult> {
  const startedAt = Date.now()

  try {
    const result = await renderTemplatePdf(
      input.template.design,
      input.payload,
      input.template.name
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
