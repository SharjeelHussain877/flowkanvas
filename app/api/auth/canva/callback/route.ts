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
import { fetchCanvaAccountIdentity } from "@/lib/services/canva/fetch-canva-profile"
import { CanvaServiceError } from "@/lib/services/canva/errors"
import { requireAuthenticatedUserId } from "@/lib/services/canva/require-user"
import { logSecurityEvent } from "@/lib/security/audit-log"

function canvaRedirect(path: string, query: Record<string, string> = {}) {
  const params = new URLSearchParams(query)
  const suffix = params.size > 0 ? `?${params.toString()}` : ""
  return NextResponse.redirect(new URL(`${path}${suffix}`, getSiteUrl()))
}

function clientIp(request: Request): string | null {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    null
  )
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const state = requestUrl.searchParams.get("state")
  const canvaError = requestUrl.searchParams.get("error")
  const canvaErrorDescription =
    requestUrl.searchParams.get("error_description") ?? "Canva authorization was denied"
  const ip = clientIp(request)

  const oauthCookies = await readCanvaOAuthCookies()
  const returnTo = getCanvaOAuthReturnTo(oauthCookies?.returnTo)

  if (canvaError) {
    await clearCanvaOAuthCookies()
    logSecurityEvent({
      event: "canva.connect.failure",
      ip,
      code: canvaError,
      message: canvaErrorDescription,
    })
    return canvaRedirect(returnTo, {
      canva: "error",
      message: formatCanvaScopeMismatchMessage(canvaErrorDescription),
    })
  }

  if (!code || !state) {
    await clearCanvaOAuthCookies()
    logSecurityEvent({
      event: "canva.connect.failure",
      ip,
      code: "MISSING_CODE",
      message: "Missing Canva authorization response",
    })
    return canvaRedirect(returnTo, {
      canva: "error",
      message: "Missing Canva authorization response",
    })
  }

  let userId: string | null = null

  try {
    userId = await requireAuthenticatedUserId()

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

    const identity = await fetchCanvaAccountIdentity(tokens.access_token).catch(
      () => null
    )

    await saveCanvaConnection(tokens, identity)
    await clearCanvaOAuthCookies()

    logSecurityEvent({
      event: "canva.connect.success",
      userId,
      ip,
    })

    return canvaRedirect(returnTo, { canva: "connected" })
  } catch (error) {
    await clearCanvaOAuthCookies()

    logSecurityEvent({
      event: "canva.connect.failure",
      userId,
      ip,
      code: error instanceof CanvaServiceError ? error.code : null,
      message: error instanceof Error ? error.message : "Could not connect Canva",
    })

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
