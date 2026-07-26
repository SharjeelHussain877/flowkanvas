import {
  ApiKeyAuthError,
  ApiKeyServiceError,
  TemplateAccessError,
} from "@/lib/services/api-keys/errors"

export function handleApiKeysRouteError(error: unknown) {
  if (error instanceof ApiKeyServiceError) {
    const body: {
      error: string
      code?: string
      details?: string
    } = {
      error: error.message,
      code: error.code,
    }

    if (process.env.NODE_ENV === "development" && error.details) {
      body.details = error.details
    }

    return Response.json(body, { status: error.status })
  }

  if (error instanceof ApiKeyAuthError) {
    return Response.json(
      { error: error.message, code: error.code },
      { status: error.status }
    )
  }

  if (error instanceof TemplateAccessError) {
    return Response.json(
      { error: error.message, code: error.code },
      { status: error.status }
    )
  }

  const message = error instanceof Error ? error.message : "Request failed"
  return Response.json({ error: message }, { status: 500 })
}
