import type {
  RecoverySessionInput,
  RecoverySessionResponse,
} from "@/schemas/auth/recovery-session"
import {
  PASSWORD_RECOVERY_COOKIE,
  passwordRecoveryCookieOptions,
} from "@/lib/auth/password-recovery-cookie"
import { createClient } from "@/lib/supabase/server"
import { mapSupabaseAuthError } from "@/lib/services/auth/errors"
import { cookies } from "next/headers"

export async function establishRecoverySession(
  input: RecoverySessionInput
): Promise<RecoverySessionResponse> {
  const supabase = await createClient()

  const { error } = await supabase.auth.setSession({
    access_token: input.access_token,
    refresh_token: input.refresh_token,
  })

  if (error) {
    throw mapSupabaseAuthError(error)
  }

  const cookieStore = await cookies()
  cookieStore.set(
    PASSWORD_RECOVERY_COOKIE,
    "1",
    passwordRecoveryCookieOptions
  )

  return { success: true }
}
