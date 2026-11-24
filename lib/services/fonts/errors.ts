import { TemplateServiceError } from "@/lib/services/templates/errors"

type SupabaseDbError = {
  message?: string
  code?: string
}

const MISSING_TABLE_CODES = new Set(["PGRST205", "42P01"])

export function isMissingFontsTable(error: SupabaseDbError): boolean {
  const message = error.message?.toLowerCase() ?? ""

  return (
    MISSING_TABLE_CODES.has(error.code ?? "") ||
    (message.includes("template_fonts") &&
      (message.includes("does not exist") ||
        message.includes("could not find") ||
        message.includes("schema cache")))
  )
}

export function mapSupabaseFontError(
  error: SupabaseDbError,
  fallbackMessage: string,
  fallbackCode: string
): TemplateServiceError {
  if (isMissingFontsTable(error)) {
    return new TemplateServiceError(
      "Custom fonts are not set up yet. Apply the Supabase migration at supabase/migrations/20261125000000_template_fonts.sql, then try again.",
      503,
      "TABLE_NOT_FOUND",
      error.message
    )
  }

  if (error.code === "42501") {
    return new TemplateServiceError(
      "You do not have permission to manage this font.",
      403,
      "FORBIDDEN",
      error.message
    )
  }

  if (error.code === "22P02") {
    return new TemplateServiceError("Font not found", 404, "NOT_FOUND", error.message)
  }

  return new TemplateServiceError(fallbackMessage, 500, fallbackCode, error.message)
}
