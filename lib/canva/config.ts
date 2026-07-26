import {
  getCanvaClientId,
  getCanvaRedirectUri,
  getCanvaScopes,
} from "@/lib/env"
import { createCanvaCodeChallenge } from "@/lib/canva/pkce"

const CANVA_AUTHORIZE_URL = "https://www.canva.com/api/oauth/authorize"

export function buildCanvaAuthorizeUrl(input: {
  codeVerifier: string
  state: string
}): string {
  const params = new URLSearchParams({
    code_challenge: createCanvaCodeChallenge(input.codeVerifier),
    code_challenge_method: "s256",
    response_type: "code",
    client_id: getCanvaClientId(),
    redirect_uri: getCanvaRedirectUri(),
    scope: getCanvaScopes(),
    state: input.state,
  })

  return `${CANVA_AUTHORIZE_URL}?${params.toString()}`
}
