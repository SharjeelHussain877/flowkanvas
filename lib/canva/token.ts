import {
  getCanvaClientId,
  getCanvaClientSecret,
  getCanvaRedirectUri,
} from "@/lib/env"

const CANVA_TOKEN_URL = "https://api.canva.com/rest/v1/oauth/token"
const CANVA_REVOKE_URL = "https://api.canva.com/rest/v1/oauth/revoke"

export type CanvaTokenResponse = {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  scope: string
}

type CanvaOAuthErrorBody = {
  code?: string
  message?: string
  error?: string
  error_description?: string
}

function getCanvaBasicAuthHeader(): string {
  const credentials = Buffer.from(
    `${getCanvaClientId()}:${getCanvaClientSecret()}`
  ).toString("base64")

  return `Basic ${credentials}`
}

async function parseCanvaTokenResponse(response: Response): Promise<CanvaTokenResponse> {
  const body = (await response.json().catch(() => ({}))) as
    | CanvaTokenResponse
    | CanvaOAuthErrorBody

  if (!response.ok) {
    const errorBody = body as CanvaOAuthErrorBody
    const message =
      errorBody.message ??
      errorBody.error_description ??
      errorBody.error ??
      "Canva token request failed"

    throw new Error(message)
  }

  return body as CanvaTokenResponse
}

export async function exchangeCanvaAuthorizationCode(input: {
  code: string
  codeVerifier: string
}): Promise<CanvaTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: input.code,
    code_verifier: input.codeVerifier,
    redirect_uri: getCanvaRedirectUri(),
  })

  const response = await fetch(CANVA_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: getCanvaBasicAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  })

  return parseCanvaTokenResponse(response)
}

export async function refreshCanvaAccessToken(
  refreshToken: string
): Promise<CanvaTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  })

  const response = await fetch(CANVA_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: getCanvaBasicAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  })

  return parseCanvaTokenResponse(response)
}

export async function revokeCanvaToken(token: string): Promise<void> {
  const body = new URLSearchParams({ token })

  const response = await fetch(CANVA_REVOKE_URL, {
    method: "POST",
    headers: {
      Authorization: getCanvaBasicAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  })

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({}))) as CanvaOAuthErrorBody
    const message =
      errorBody.message ??
      errorBody.error_description ??
      errorBody.error ??
      "Canva revoke request failed"

    throw new Error(message)
  }
}
