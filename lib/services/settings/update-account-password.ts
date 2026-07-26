import type {
  SettingsChangePasswordInput,
  SettingsChangePasswordResponse,
} from "@/schemas/settings/change-password"
import { mapSupabaseAuthError, AuthServiceError } from "@/lib/services/auth/errors"
import { verifyCurrentPassword } from "@/lib/services/settings/verify-current-password"
import { createClient } from "@/lib/supabase/server"

export async function updateAccountPassword(
  input: SettingsChangePasswordInput
): Promise<SettingsChangePasswordResponse> {
  await verifyCurrentPassword(input.currentPassword)

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({
    password: input.newPassword,
  })

  if (error) {
    throw mapSupabaseAuthError(error)
  }

  return {
    success: true,
    message: "Password updated successfully",
  }
}
