import { cookies } from "next/headers"

export const CANVA_OAUTH_STATE_COOKIE = "canva_oauth_state"
export const CANVA_OAUTH_CODE_VERIFIER_COOKIE = "canva_oauth_code_verifier"
export const CANVA_OAUTH_RETURN_TO_COOKIE = "canva_oauth_return_to"

const OAUTH_COOKIE_MAX_AGE_SECONDS = 60 * 10

type CanvaOAuthCookiePayload = {
  state: string
  codeVerifier: string
  returnTo?: string
}

function getOAuthCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: OAUTH_COOKIE_MAX_AGE_SECONDS,
  }
}

export async function setCanvaOAuthCookies(payload: CanvaOAuthCookiePayload) {
  const cookieStore = await cookies()
  const options = getOAuthCookieOptions()

  cookieStore.set(CANVA_OAUTH_STATE_COOKIE, payload.state, options)
  cookieStore.set(
    CANVA_OAUTH_CODE_VERIFIER_COOKIE,
    payload.codeVerifier,
    options
  )

  if (payload.returnTo) {
    cookieStore.set(CANVA_OAUTH_RETURN_TO_COOKIE, payload.returnTo, options)
  }
}

export async function readCanvaOAuthCookies(): Promise<CanvaOAuthCookiePayload | null> {
  const cookieStore = await cookies()
  const state = cookieStore.get(CANVA_OAUTH_STATE_COOKIE)?.value
  const codeVerifier = cookieStore.get(CANVA_OAUTH_CODE_VERIFIER_COOKIE)?.value
  const returnTo = cookieStore.get(CANVA_OAUTH_RETURN_TO_COOKIE)?.value

  if (!state || !codeVerifier) {
    return null
  }

  return {
    state,
    codeVerifier,
    returnTo,
  }
}

export async function clearCanvaOAuthCookies() {
  const cookieStore = await cookies()

  cookieStore.delete(CANVA_OAUTH_STATE_COOKIE)
  cookieStore.delete(CANVA_OAUTH_CODE_VERIFIER_COOKIE)
  cookieStore.delete(CANVA_OAUTH_RETURN_TO_COOKIE)
}
