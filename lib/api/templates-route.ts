import { handleApiKeysRouteError } from "@/lib/api/api-keys-route"
import { RateLimitError } from "@/lib/api/rate-limit"
import type { GenerateTemplatePdfResult } from "@/lib/services/templates/generate-template-pdf"
import { TemplateServiceError } from "@/lib/services/templates/errors"

export function handleTemplatesRouteError(error: unknown) {
  if (error instanceof TemplateServiceError) {
    const body: { error: string; code: string; details?: string } = {
      error: error.message,
      code: error.code,
    }

    if (process.env.NODE_ENV === "development" && error.details) {
      body.details = error.details
    }

    return Response.json(body, { status: error.status })
  }

  if (error instanceof RateLimitError) {
    return Response.json(
      { error: error.message, code: error.code },
      { status: error.status }
    )
  }

  return handleApiKeysRouteError(error)
}

export function pdfResponse(result: GenerateTemplatePdfResult, inline: boolean) {
  const headers: Record<string, string> = {
    "Content-Type": "application/pdf",
    "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${result.filename}"`,
    "Cache-Control": "no-store",
  }

  if (result.missingVariables.length > 0) {
    headers["X-Flowkanvas-Missing-Variables"] = result.missingVariables.join(",")
  }

  if (result.warnings.length > 0) {
    headers["X-Flowkanvas-Warning"] = result.warnings.join(" ").replace(/[\r\n]+/g, " ")
  }

  return new Response(result.bytes, { status: 200, headers })
}

export function wantsInlinePdf(request: Request): boolean {
  const inline = new URL(request.url).searchParams.get("inline")
  return inline === "1" || inline === "true"
}
