import { NextResponse } from "next/server"

import { formatCanvaScopeMismatchMessage } from "@/lib/canva/scopes"
import { exchangeCanvaAuthorizationCode } from "@/lib/canva/token"
import {
  clearCanvaOAuthCookies,
  readCanvaOAuthCookies,
} from "@/lib/canva/oauth-cookies"
import { dashboardRoutes } from "@/lib/dashboard/routes"
import { getSiteUrl } from "@/lib/env"
import { saveCanvaConnection } from "@/lib/services/canva/connection"
import { CanvaServiceError } from "@/lib/services/canva/errors"
import { requireAuthenticatedUserId } from "@/lib/services/canva/require-user"

function settingsRedirect(query: Record<string, string>) {
  const params = new URLSearchParams(query)
  return NextResponse.redirect(
    new URL(`${dashboardRoutes.settings.general}?${params.toString()}`, getSiteUrl())
  )
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const state = requestUrl.searchParams.get("state")
  const canvaError = requestUrl.searchParams.get("error")
  const canvaErrorDescription =
    requestUrl.searchParams.get("error_description") ?? "Canva authorization was denied"

  if (canvaError) {
    await clearCanvaOAuthCookies()
    return settingsRedirect({
      canva: "error",
      message: formatCanvaScopeMismatchMessage(canvaErrorDescription),
    })
  }

  if (!code || !state) {
    await clearCanvaOAuthCookies()
    return settingsRedirect({
      canva: "error",
      message: "Missing Canva authorization response",
    })
  }

  try {
    await requireAuthenticatedUserId()

    const oauthCookies = await readCanvaOAuthCookies()

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

    return settingsRedirect({ canva: "connected" })
  } catch (error) {
    await clearCanvaOAuthCookies()

    if (error instanceof CanvaServiceError && error.code === "UNAUTHORIZED") {
      return NextResponse.redirect(new URL("/login", getSiteUrl()))
    }

    const message =
      error instanceof Error ? error.message : "Could not connect Canva"

    return settingsRedirect({
      canva: "error",
      message: formatCanvaScopeMismatchMessage(message),
    })
  }
}
