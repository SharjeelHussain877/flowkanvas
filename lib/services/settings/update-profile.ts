import type {
  UpdateProfileInput,
  UpdateProfileResponse,
} from "@/schemas/settings/update-profile"
import { createClient } from "@/lib/supabase/server"
import { AuthServiceError } from "@/lib/services/auth/errors"
import {
  getInitials,
  parseProfileFromUser,
} from "@/lib/services/settings/parse-profile"
import { normalizeAvatarUrlForMetadata } from "@/lib/services/settings/normalize-avatar-url"
import { storeAvatarFile } from "@/lib/services/settings/validate-avatar-file"
import { syncAuthUserMetadata } from "@/lib/services/settings/sync-auth-user-metadata"

export async function updateProfile(
  input: UpdateProfileInput,
  avatarFile?: File | null
): Promise<UpdateProfileResponse> {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new AuthServiceError("Unauthorized", 401, "UNAUTHORIZED")
  }

  const currentProfile = parseProfileFromUser(user)
  const firstName = input.firstName.trim()
  const lastName = input.lastName.trim()

  let avatarUrl = currentProfile.avatarUrl

  if (avatarFile) {
    avatarUrl = await storeAvatarFile(supabase, user.id, avatarFile)
  }

  const normalizedAvatarUrl = normalizeAvatarUrlForMetadata(avatarUrl)

  await syncAuthUserMetadata({
    userId: user.id,
    firstName,
    lastName,
    avatarUrl: normalizedAvatarUrl,
    email: input.email,
  })

  const emailChanged = input.email !== currentProfile.email

  return {
    success: true,
    message: emailChanged
      ? "Profile updated. Check your inbox if email confirmation is required."
      : "Profile updated successfully",
    profile: {
      firstName,
      lastName,
      email: input.email,
      initials: getInitials(firstName, lastName, input.email),
      avatarUrl: normalizedAvatarUrl,
    },
  }
}
