import { NextResponse } from "next/server"

import { buildCanvaAuthorizeUrl } from "@/lib/canva/config"
import {
  clearCanvaOAuthCookies,
  setCanvaOAuthCookies,
} from "@/lib/canva/oauth-cookies"
import {
  createCanvaCodeVerifier,
  createCanvaOAuthState,
} from "@/lib/canva/pkce"
import { handleCanvaRouteError } from "@/lib/api/canva-route"
import { dashboardRoutes } from "@/lib/dashboard/routes"
import { getSiteUrl } from "@/lib/env"
import { CanvaServiceError } from "@/lib/services/canva/errors"
import { requireAuthenticatedUserId } from "@/lib/services/canva/require-user"

function settingsRedirect(path: string) {
  return NextResponse.redirect(new URL(path, getSiteUrl()))
}

export async function GET() {
  try {
    await requireAuthenticatedUserId()

    const state = createCanvaOAuthState()
    const codeVerifier = createCanvaCodeVerifier()

    await setCanvaOAuthCookies({ state, codeVerifier })

    const authorizeUrl = buildCanvaAuthorizeUrl({ state, codeVerifier })
    return NextResponse.redirect(authorizeUrl)
  } catch (error) {
    if (error instanceof CanvaServiceError && error.code === "UNAUTHORIZED") {
      return settingsRedirect("/login")
    }

    await clearCanvaOAuthCookies()
    return settingsRedirect(
      `${dashboardRoutes.settings.general}?canva=error&message=${encodeURIComponent(
        error instanceof Error ? error.message : "Could not start Canva authorization"
      )}`
    )
  }
}
