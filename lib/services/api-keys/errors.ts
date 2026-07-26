export class ApiKeyServiceError extends Error {
  status: number
  code?: string
  details?: string

  constructor(
    message: string,
    status: number,
    code?: string,
    details?: string
  ) {
    super(message)
    this.name = "ApiKeyServiceError"
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

function isMissingApiKeysTable(error: SupabaseDbError): boolean {
  const message = error.message?.toLowerCase() ?? ""

  return (
    MISSING_TABLE_CODES.has(error.code ?? "") ||
    message.includes("api_keys") &&
      (message.includes("does not exist") ||
        message.includes("could not find") ||
        message.includes("schema cache"))
  )
}

export function mapSupabaseApiKeyError(
  error: SupabaseDbError,
  fallbackMessage: string,
  fallbackCode: string
): ApiKeyServiceError {
  if (isMissingApiKeysTable(error)) {
    return new ApiKeyServiceError(
      "API keys storage is not set up yet. Apply the Supabase migration at supabase/migrations/20260726000000_create_api_keys.sql, then reload this page.",
      503,
      "TABLE_NOT_FOUND",
      error.message
    )
  }

  if (error.code === "42501") {
    return new ApiKeyServiceError(
      "You do not have permission to access API keys.",
      403,
      "FORBIDDEN",
      error.message
    )
  }

  return new ApiKeyServiceError(
    fallbackMessage,
    500,
    fallbackCode,
    error.message
  )
}

export class TemplateAccessError extends Error {
  status = 403
  code = "FORBIDDEN"

  constructor(message = "You do not have access to this template.") {
    super(message)
    this.name = "TemplateAccessError"
  }
}

export class ApiKeyAuthError extends Error {
  status: number
  code: string

  constructor(
    message: string,
    status: number,
    code: string
  ) {
    super(message)
    this.name = "ApiKeyAuthError"
    this.status = status
    this.code = code
  }
}
