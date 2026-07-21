import { z } from "zod"

import { isPasswordValid } from "@/lib/auth/password-requirements"
import { requiredString } from "@/schemas/generic/required-string"

export const passwordField = requiredString("Password is required")
  .min(8, "Password must be at least 8 characters")
  .refine(isPasswordValid, {
    message: "Password does not meet all requirements",
  })
