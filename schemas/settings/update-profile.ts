import { z } from "zod"

import { emailField } from "@/schemas/generic/email"
import { requiredString } from "@/schemas/generic/required-string"

const profileNameField = (label: string) =>
  requiredString(`${label} is required`)
    .trim()
    .min(2, `${label} must be at least 2 characters`)
    .max(50, `${label} must be at most 50 characters`)

export const updateProfileSchema = z.object({
  firstName: profileNameField("First name"),
  lastName: profileNameField("Last name"),
  email: emailField,
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>

export type UpdateProfileResponse = {
  success: true
  message: string
  profile: {
    firstName: string
    lastName: string
    email: string
    initials: string
    avatarUrl: string | null
  }
}
