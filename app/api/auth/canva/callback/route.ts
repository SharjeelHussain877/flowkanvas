import { NextResponse } from "next/server"

import { formatCanvaScopeMismatchMessage } from "@/lib/canva/scopes"
import { exchangeCanvaAuthorizationCode } from "@/lib/canva/token"
import {
  clearCanvaOAuthCookies,
  readCanvaOAuthCookies,
} from "@/lib/canva/oauth-cookies"
import { getCanvaOAuthReturnTo } from "@/lib/canva/oauth-return"
import { getSiteUrl } from "@/lib/env"
import { saveCanvaConnection } from "@/lib/services/canva/connection"
import { CanvaServiceError } from "@/lib/services/canva/errors"
import { requireAuthenticatedUserId } from "@/lib/services/canva/require-user"

function canvaRedirect(path: string, query: Record<string, string> = {}) {
  const params = new URLSearchParams(query)
  const suffix = params.size > 0 ? `?${params.toString()}` : ""
  return NextResponse.redirect(new URL(`${path}${suffix}`, getSiteUrl()))
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const state = requestUrl.searchParams.get("state")
  const canvaError = requestUrl.searchParams.get("error")
  const canvaErrorDescription =
    requestUrl.searchParams.get("error_description") ?? "Canva authorization was denied"

  const oauthCookies = await readCanvaOAuthCookies()
  const returnTo = getCanvaOAuthReturnTo(oauthCookies?.returnTo)

  if (canvaError) {
    await clearCanvaOAuthCookies()
    return canvaRedirect(returnTo, {
      canva: "error",
      message: formatCanvaScopeMismatchMessage(canvaErrorDescription),
    })
  }

  if (!code || !state) {
    await clearCanvaOAuthCookies()
    return canvaRedirect(returnTo, {
      canva: "error",
      message: "Missing Canva authorization response",
    })
  }

  try {
    await requireAuthenticatedUserId()

    if (!oauthCookies || oauthCookies.state !== state) {
      throw new CanvaServiceError(
        "Canva authorization state mismatch",
        400,
        "INVALID_STATE"
      )
    }

    const tokens = await exchangeCanvaAuthorizationCode({
      code,
      codeVerifier: oauthCookies.codeVerifier,
    })

    await saveCanvaConnection(tokens)
    await clearCanvaOAuthCookies()

    return canvaRedirect(returnTo, { canva: "connected" })
  } catch (error) {
    await clearCanvaOAuthCookies()

    if (error instanceof CanvaServiceError && error.code === "UNAUTHORIZED") {
      return NextResponse.redirect(new URL("/login", getSiteUrl()))
    }

    const message =
      error instanceof Error ? error.message : "Could not connect Canva"

    return canvaRedirect(returnTo, {
      canva: "error",
      message: formatCanvaScopeMismatchMessage(message),
    })
  }
}
