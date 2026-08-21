import { z } from "zod"

export const generateCanvaPdfSchema = z.object({
  kind: z.enum(["design", "brand_template"]).optional(),
  payload: z.record(z.string(), z.unknown()).default({}),
})

export type GenerateCanvaPdfInput = z.infer<typeof generateCanvaPdfSchema>
