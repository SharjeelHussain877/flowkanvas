import { NextResponse } from "next/server"

import { buildCanvaAuthorizeUrl } from "@/lib/canva/config"
import { formatCanvaScopeMismatchMessage } from "@/lib/canva/scopes"
import {
  clearCanvaOAuthCookies,
  setCanvaOAuthCookies,
} from "@/lib/canva/oauth-cookies"
import {
  createCanvaCodeVerifier,
  createCanvaOAuthState,
} from "@/lib/canva/pkce"
import { dashboardRoutes } from "@/lib/dashboard/routes"
import { getSiteUrl } from "@/lib/env"
import { CanvaServiceError } from "@/lib/services/canva/errors"
import { requireAuthenticatedUserId } from "@/lib/services/canva/require-user"

function resolveCanvaReturnTo(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return dashboardRoutes.settings.general
  }

  return value
}

function canvaRedirect(path: string, query: Record<string, string> = {}) {
  const params = new URLSearchParams(query)
  const suffix = params.size > 0 ? `?${params.toString()}` : ""
  return NextResponse.redirect(new URL(`${path}${suffix}`, getSiteUrl()))
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const returnTo = resolveCanvaReturnTo(requestUrl.searchParams.get("returnTo"))

  try {
    await requireAuthenticatedUserId()

    const state = createCanvaOAuthState()
    const codeVerifier = createCanvaCodeVerifier()

    await setCanvaOAuthCookies({ state, codeVerifier, returnTo })

    const authorizeUrl = buildCanvaAuthorizeUrl({ state, codeVerifier })
    return NextResponse.redirect(authorizeUrl)
  } catch (error) {
    if (error instanceof CanvaServiceError && error.code === "UNAUTHORIZED") {
      return canvaRedirect("/login")
    }

    const message = formatCanvaScopeMismatchMessage(
      error instanceof Error ? error.message : "Could not start Canva authorization"
    )

    await clearCanvaOAuthCookies()
    return canvaRedirect(returnTo, {
      canva: "error",
      message,
    })
  }
}
