import { z } from "zod"

const generatePayloadSchema = z.record(z.string(), z.unknown())

export const generateTemplateJsonSchema = z.object({
  payload: generatePayloadSchema.optional(),
})

/** Parsed request payload - text values and image sources keyed by variable name. */
export type GenerateRequestPayload = {
  values: Record<string, string>
  images: Record<string, GeneratePayloadImage>
}

export type GeneratePayloadImage =
  | { kind: "bytes"; data: Uint8Array; contentType: string | null }
  | { kind: "url"; url: string }

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024
