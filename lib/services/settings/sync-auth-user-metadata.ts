import { createAdminClient } from "@/lib/supabase/admin"
import { mapSupabaseAuthError } from "@/lib/services/auth/errors"
import { buildProfileMetadata } from "@/lib/services/settings/build-profile-metadata"
import { normalizeAvatarUrlForMetadata } from "@/lib/services/settings/normalize-avatar-url"

type SyncAuthUserMetadataInput = {
  userId: string
  firstName: string
  lastName: string
  avatarUrl: string | null
  email?: string
}

export async function syncAuthUserMetadata(
  input: SyncAuthUserMetadataInput
): Promise<void> {
  const admin = createAdminClient()
  const payload: {
    email?: string
    user_metadata: Record<string, string>
  } = {
    user_metadata: buildProfileMetadata({
      firstName: input.firstName,
      lastName: input.lastName,
      avatarUrl: normalizeAvatarUrlForMetadata(input.avatarUrl),
    }),
  }

  if (input.email) {
    payload.email = input.email
  }

  const { error } = await admin.auth.admin.updateUserById(input.userId, payload)

  if (error) {
    throw mapSupabaseAuthError(error)
  }
}
