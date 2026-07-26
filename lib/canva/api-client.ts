import type { CanvaApiErrorBody } from "@/lib/canva/types"
import { getValidCanvaAccessToken } from "@/lib/services/canva/access-token"
import { CanvaServiceError } from "@/lib/services/canva/errors"

const CANVA_API_BASE = "https://api.canva.com/rest/v1"

type CanvaApiQuery = Record<string, string | number | undefined>

export async function canvaApiGet<T>(
  userId: string,
  path: string,
  query?: CanvaApiQuery
): Promise<T> {
  const accessToken = await getValidCanvaAccessToken(userId)
  const url = new URL(`${CANVA_API_BASE}${path}`)

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value))
      }
    }
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  })

  const body: unknown = await response.json().catch(() => ({}))

  if (!response.ok) {
    const errorBody = body as CanvaApiErrorBody
    throw new CanvaServiceError(
      errorBody.message ?? "Canva API request failed",
      response.status,
      errorBody.code ?? "CANVA_API_ERROR"
    )
  }

  return body as T
}
