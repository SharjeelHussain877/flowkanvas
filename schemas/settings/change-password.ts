import { z } from "zod"

import { passwordField } from "@/schemas/generic/password"
import { requiredString } from "@/schemas/generic/required-string"

export const verifyCurrentPasswordSchema = z.object({
  currentPassword: requiredString("Current password is required"),
})

export type VerifyCurrentPasswordInput = z.infer<
  typeof verifyCurrentPasswordSchema
>

export type VerifyCurrentPasswordResponse = {
  valid: true
}

export const settingsChangePasswordSchema = z
  .object({
    currentPassword: requiredString("Current password is required"),
    newPassword: passwordField,
    confirmPassword: passwordField,
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from your current password",
    path: ["newPassword"],
  })

export type SettingsChangePasswordInput = z.infer<
  typeof settingsChangePasswordSchema
>

export const currentPasswordVerificationStatusSchema = z.enum([
  "idle",
  "verifying",
  "valid",
  "invalid",
])

export type CurrentPasswordVerificationStatus = z.infer<
  typeof currentPasswordVerificationStatusSchema
>

export const changePasswordFormSchema = settingsChangePasswordSchema.and(
  z.object({
    verificationStatus: currentPasswordVerificationStatusSchema,
    showNewPassword: z.boolean(),
    showConfirmPassword: z.boolean(),
  })
)

export type ChangePasswordFormValues = z.infer<typeof changePasswordFormSchema>

export type SettingsChangePasswordResponse = {
  success: true
  message: string
}
