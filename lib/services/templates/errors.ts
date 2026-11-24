export class TemplateServiceError extends Error {
  status: number
  code: string
  details?: string

  constructor(message: string, status: number, code: string, details?: string) {
    super(message)
    this.name = "TemplateServiceError"
    this.status = status
    this.code = code
    this.details = details
  }
}

type SupabaseDbError = {
  message?: string
  code?: string
  details?: string
  hint?: string
}

const MISSING_TABLE_CODES = new Set(["PGRST205", "42P01"])

function isMissingTable(error: SupabaseDbError): boolean {
  const message = error.message?.toLowerCase() ?? ""

  return (
    MISSING_TABLE_CODES.has(error.code ?? "") ||
    (message.includes("templates") &&
      (message.includes("does not exist") ||
        message.includes("could not find") ||
        message.includes("schema cache")))
  )
}

export function mapSupabaseTemplateError(
  error: SupabaseDbError,
  fallbackMessage: string,
  fallbackCode: string
): TemplateServiceError {
  if (isMissingTable(error)) {
    return new TemplateServiceError(
      "Template storage is not set up yet. Apply the Supabase migration at supabase/migrations/20261124000000_templates.sql, then reload this page.",
      503,
      "TABLE_NOT_FOUND",
      error.message
    )
  }

  if (error.code === "42501") {
    return new TemplateServiceError(
      "You do not have permission to access this template.",
      403,
      "FORBIDDEN",
      error.message
    )
  }

  if (error.code === "22P02") {
    return new TemplateServiceError("Template not found", 404, "NOT_FOUND", error.message)
  }

  return new TemplateServiceError(fallbackMessage, 500, fallbackCode, error.message)
}
