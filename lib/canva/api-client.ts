import type { CanvaApiErrorBody } from "@/lib/canva/types"
import { getValidCanvaAccessToken } from "@/lib/services/canva/access-token"
import { CanvaServiceError } from "@/lib/services/canva/errors"
import {
  CANVA_TOKEN_REVOKED_CODE,
  isCanvaTokenRevokedError,
  removeRevokedCanvaConnection,
} from "@/lib/services/canva/token-revoked"

const CANVA_API_BASE = "https://api.canva.com/rest/v1"

type CanvaApiQuery = Record<string, string | number | undefined>

function buildCanvaUrl(path: string, query?: CanvaApiQuery) {
  const url = new URL(`${CANVA_API_BASE}${path}`)

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value))
      }
    }
  }

  return url
}

function throwCanvaResponseError(status: number, body: unknown): never {
  const errorBody = body as CanvaApiErrorBody
  const message = errorBody.message ?? "Canva API request failed"
  const code = errorBody.code ?? "CANVA_API_ERROR"
  const error = new CanvaServiceError(message, status, code)

  if (isCanvaTokenRevokedError(error)) {
    throw new CanvaServiceError(message, 401, CANVA_TOKEN_REVOKED_CODE)
  }

  throw error
}

async function authorizedCanvaFetch(
  userId: string,
  url: URL,
  init?: RequestInit
) {
  const accessToken = await getValidCanvaAccessToken(userId)

  return fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...init?.headers,
    },
    cache: "no-store",
  })
}

async function parseCanvaJson<T>(userId: string, response: Response): Promise<T> {
  const body: unknown = await response.json().catch(() => ({}))

  if (!response.ok) {
    throwCanvaResponseError(response.status, body)
  }

  return body as T
}

async function withCanvaAuth<T>(
  userId: string,
  run: () => Promise<T>
): Promise<T> {
  try {
    return await run()
  } catch (error) {
    if (isCanvaTokenRevokedError(error)) {
      await removeRevokedCanvaConnection(userId)
      throw new CanvaServiceError(
        "Canva access was revoked. Please reconnect.",
        401,
        CANVA_TOKEN_REVOKED_CODE
      )
    }

    throw error
  }
}

export async function canvaApiGetWithToken<T>(
  accessToken: string,
  path: string,
  query?: CanvaApiQuery
): Promise<T> {
  const response = await fetch(buildCanvaUrl(path, query), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  })

  const body: unknown = await response.json().catch(() => ({}))

  if (!response.ok) {
    throwCanvaResponseError(response.status, body)
  }

  return body as T
}

export async function canvaApiGet<T>(
  userId: string,
  path: string,
  query?: CanvaApiQuery
): Promise<T> {
  return withCanvaAuth(userId, async () => {
    const response = await authorizedCanvaFetch(
      userId,
      buildCanvaUrl(path, query)
    )
    return parseCanvaJson<T>(userId, response)
  })
}

export async function canvaApiPost<T>(
  userId: string,
  path: string,
  body: unknown
): Promise<T> {
  return withCanvaAuth(userId, async () => {
    const response = await authorizedCanvaFetch(userId, buildCanvaUrl(path), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
    return parseCanvaJson<T>(userId, response)
  })
}
