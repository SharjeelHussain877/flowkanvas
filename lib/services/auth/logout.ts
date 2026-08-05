import type { LogoutResponse } from "@/schemas/auth/logout"
import {
  PASSWORD_RECOVERY_COOKIE,
  passwordRecoveryCookieOptions,
} from "@/lib/auth/password-recovery-cookie"
import { createClient } from "@/lib/supabase/server"
import { mapSupabaseAuthError } from "@/lib/services/auth/errors"
import { cookies } from "next/headers"

export async function logoutUser(): Promise<LogoutResponse> {
  const supabase = await createClient()

  const { error } = await supabase.auth.signOut({ scope: "local" })

  if (error) {
    throw mapSupabaseAuthError(error)
  }

  const cookieStore = await cookies()
  cookieStore.set(PASSWORD_RECOVERY_COOKIE, "", {
    ...passwordRecoveryCookieOptions,
    maxAge: 0,
  })

  return {
    success: true,
    message: "Logged out successfully",
  }
}
