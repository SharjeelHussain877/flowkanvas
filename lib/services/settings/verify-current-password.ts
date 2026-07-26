import {
  AuthServiceError,
  mapSupabaseAuthError,
} from "@/lib/services/auth/errors"
import { createClient } from "@/lib/supabase/server"
import type { VerifyCurrentPasswordResponse } from "@/schemas/settings/change-password"

export async function verifyCurrentPassword(
  currentPassword: string
): Promise<VerifyCurrentPasswordResponse> {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user?.email) {
    throw new AuthServiceError("Unauthorized", 401, "UNAUTHORIZED")
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  })

  if (error) {
    const mapped = mapSupabaseAuthError(error)

    if (mapped.code === "INVALID_CREDENTIALS") {
      throw new AuthServiceError(
        "Current password is incorrect",
        400,
        "INVALID_CURRENT_PASSWORD"
      )
    }

    throw mapped
  }

  return { valid: true }
}
