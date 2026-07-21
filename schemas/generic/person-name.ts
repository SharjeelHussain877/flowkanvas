import { requiredString } from "@/schemas/generic/required-string"

export const personNameField = requiredString("Full name is required")
  .trim()
  .min(2, "Full name must be at least 2 characters")
