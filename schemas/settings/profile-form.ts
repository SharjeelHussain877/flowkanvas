import { z } from "zod"

import {
  ALLOWED_AVATAR_MIME_TYPES,
  MAX_AVATAR_SIZE_BYTES,
} from "@/schemas/settings/upload-avatar"
import { updateProfileSchema } from "@/schemas/settings/update-profile"

const avatarFileSchema = z
  .instanceof(File)
  .nullable()
  .refine(
    (file) =>
      file === null ||
      ALLOWED_AVATAR_MIME_TYPES.includes(
        file.type as (typeof ALLOWED_AVATAR_MIME_TYPES)[number]
      ),
    { message: "Upload a JPG, PNG, or WebP image" }
  )
  .refine(
    (file) => file === null || file.size <= MAX_AVATAR_SIZE_BYTES,
    { message: "Image must be 2 MB or smaller" }
  )

export const profileFormSchema = updateProfileSchema.extend({
  avatar: avatarFileSchema,
  savedAvatarUrl: z.string().nullable(),
})

export type ProfileFormInput = z.infer<typeof profileFormSchema>

export const profileFormUiSchema = profileFormSchema.extend({
  isEditing: z.boolean(),
})

export type ProfileFormValues = z.infer<typeof profileFormUiSchema>

export function toProfileFormValues(profile: {
  firstName: string
  lastName: string
  email: string
  avatarUrl: string | null
}): ProfileFormInput {
  return {
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
    avatar: null,
    savedAvatarUrl: profile.avatarUrl,
  }
}
