"use client"

import { useEffect } from "react"

import { parseImplicitAuthHash } from "@/lib/auth/implicit-auth-hash"

/**
 * Supabase may land recovery emails on Site URL with an implicit hash
 * (`/#access_token=...&type=recovery`). Always send those to change-password.
 */
export function RecoveryHashRedirect() {
  useEffect(() => {
    const parsed = parseImplicitAuthHash(window.location.hash)

    if (parsed?.type !== "recovery") {
      return
    }

    const { pathname } = window.location
    if (
      pathname === "/change-password" ||
      pathname.startsWith("/change-password/")
    ) {
      return
    }

    window.location.replace(`/change-password${window.location.hash}`)
  }, [])

  return null
}
