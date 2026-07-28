import type { EmailOtpType } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

import { getAuthConfirmNextPath } from "@/lib/auth/confirm-redirect"
import { createClient } from "@/lib/supabase/server"
import { buildSitePath, getSiteUrl } from "@/lib/env"
import { mapSupabaseAuthError } from "@/lib/services/auth/errors"

function redirectToLogin(errorCode: string) {
  const params = new URLSearchParams({ error: errorCode })
  return NextResponse.redirect(
    new URL(`/login?${params.toString()}`, getSiteUrl())
  )
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const tokenHash = requestUrl.searchParams.get("token_hash")
  const type = requestUrl.searchParams.get("type")
  const code = requestUrl.searchParams.get("code")
  const nextPath = getAuthConfirmNextPath(type, requestUrl.searchParams.get("next"))

  const supabase = await createClient()
  const isRecoveryFlow =
    type === "recovery" || nextPath.includes("change-password")

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      mapSupabaseAuthError(error)
      return redirectToLogin(
        isRecoveryFlow
          ? "recovery_confirmation_failed"
          : "email_confirmation_failed"
      )
    }

    return NextResponse.redirect(buildSitePath(nextPath))
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as EmailOtpType,
    })

    if (error) {
      mapSupabaseAuthError(error)
      return redirectToLogin(
        type === "recovery" || type === "email_change"
          ? "recovery_confirmation_failed"
          : "email_confirmation_failed"
      )
    }

    return NextResponse.redirect(buildSitePath(nextPath))
  }

  return redirectToLogin("invalid_confirmation_link")
}
