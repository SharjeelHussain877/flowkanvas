import { z } from "zod"

import { requiredString } from "@/schemas/generic/required-string"

export const emailField = requiredString("Email is required")
  .trim()
  .toLowerCase()
  .email("Enter a valid email address")
