import { z } from "zod"

import { requiredString } from "@/schemas/generic/required-string"

export const createApiKeySchema = z.object({
  name: requiredString("Key name is required")
    .trim()
    .min(2, "Key name must be at least 2 characters")
    .max(64, "Key name must be at most 64 characters"),
})

export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>
