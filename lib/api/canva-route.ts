import { CanvaServiceError } from "@/lib/services/canva/errors"

export function handleCanvaRouteError(error: unknown) {
  if (error instanceof CanvaServiceError) {
    return Response.json(
      { error: error.message, code: error.code },
      { status: error.status }
    )
  }

  const message = error instanceof Error ? error.message : "Request failed"
  return Response.json({ error: message }, { status: 500 })
}
