import { z } from "zod"

import { requiredString } from "@/schemas/generic/required-string"

export const recoverySessionSchema = z.object({
  access_token: requiredString("Access token is required"),
  refresh_token: requiredString("Refresh token is required"),
})

export type RecoverySessionInput = z.infer<typeof recoverySessionSchema>

export type RecoverySessionResponse = {
  success: true
}
