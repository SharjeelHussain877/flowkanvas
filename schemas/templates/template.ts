import { z } from "zod"

import { requiredString } from "@/schemas/generic/required-string"
import {
  MAX_PAGE_SIZE,
  MIN_PAGE_SIZE,
  templateDesignSchema,
  type TemplateDesign,
} from "@/schemas/templates/design"

export const templateNameField = requiredString("Template name is required")
  .trim()
  .min(1, "Template name is required")
  .max(80, "Template name must be 80 characters or fewer")

const pageDimension = z
  .number({ error: "Enter a number" })
  .finite()
  .min(MIN_PAGE_SIZE, `Minimum size is ${MIN_PAGE_SIZE}px`)
  .max(MAX_PAGE_SIZE, `Maximum size is ${MAX_PAGE_SIZE}px`)

export const createTemplateSchema = z.object({
  name: templateNameField,
  width: pageDimension,
  height: pageDimension,
})

export const updateTemplateSchema = z
  .object({
    name: templateNameField.optional(),
    design: templateDesignSchema.optional(),
  })
  .refine((value) => value.name !== undefined || value.design !== undefined, {
    message: "Nothing to update",
  })

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>

export type TemplateVariables = {
  text: string[]
  images: string[]
}

export type TemplateRecord = {
  id: string
  name: string
  width: number
  height: number
  design: TemplateDesign
  created_at: string
  updated_at: string
}

export type TemplatesListResponse = {
  data: TemplateRecord[]
}

export type TemplateApiResponse = {
  data: TemplateRecord
}

export type DeleteTemplateApiResponse = {
  data: { id: string }
}

export type TemplateAssetUploadResponse = {
  data: { url: string }
}

/** Public API shape (API key consumers). */
export type PublicTemplate = {
  id: string
  name: string
  width: number
  height: number
  variables: TemplateVariables
  updated_at: string
}
