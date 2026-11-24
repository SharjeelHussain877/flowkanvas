import { z } from "zod"

export const generatePayloadSchema = z.record(z.string(), z.unknown())

export const generateTemplateJsonSchema = z.object({
  payload: generatePayloadSchema.optional(),
})

export type GeneratePayloadValue = string | Uint8Array

/** Parsed request payload - text values and image sources keyed by variable name. */
export type GenerateRequestPayload = {
  values: Record<string, string>
  images: Record<string, GeneratePayloadImage>
}

export type GeneratePayloadImage =
  | { kind: "bytes"; data: Uint8Array; contentType: string | null }
  | { kind: "url"; url: string }

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024
export const MAX_ASSET_BYTES = 5 * 1024 * 1024
export const ALLOWED_ASSET_MIME_TYPES = ["image/png", "image/jpeg"] as const
