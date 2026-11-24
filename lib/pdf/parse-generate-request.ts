import { TemplateServiceError } from "@/lib/services/templates/errors"
import {
  generateTemplateJsonSchema,
  MAX_IMAGE_BYTES,
  type GeneratePayloadImage,
  type GenerateRequestPayload,
} from "@/schemas/templates/generate"

function emptyPayload(): GenerateRequestPayload {
  return { values: {}, images: {} }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function assignValue(payload: GenerateRequestPayload, name: string, value: unknown) {
  if (value === null || value === undefined) {
    return
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    payload.values[name] = String(value)
    return
  }

  if (isRecord(value)) {
    if (typeof value.url === "string") {
      payload.images[name] = { kind: "url", url: value.url }
      return
    }

    if (typeof value.text === "string") {
      payload.values[name] = value.text
      return
    }
  }

  throw new TemplateServiceError(
    `Variable "${name}" must be a string, number, boolean, or { "url": "..." } for images.`,
    400,
    "INVALID_PAYLOAD"
  )
}

function applyJsonObject(payload: GenerateRequestPayload, body: unknown) {
  if (!isRecord(body)) {
    throw new TemplateServiceError(
      'Send a JSON object like { "payload": { "name": "Ali" } }.',
      400,
      "INVALID_PAYLOAD"
    )
  }

  const parsed = generateTemplateJsonSchema.safeParse(body)
  const source = parsed.success && parsed.data.payload ? parsed.data.payload : body

  for (const [name, value] of Object.entries(source)) {
    if (name === "payload" && source === body && isRecord(value)) {
      continue
    }

    assignValue(payload, name, value)
  }
}

async function fileToImage(file: File, name: string): Promise<GeneratePayloadImage> {
  if (file.size > MAX_IMAGE_BYTES) {
    throw new TemplateServiceError(
      `"${name}" is larger than ${MAX_IMAGE_BYTES / (1024 * 1024)} MB`,
      400,
      "IMAGE_TOO_LARGE"
    )
  }

  return {
    kind: "bytes",
    data: new Uint8Array(await file.arrayBuffer()),
    contentType: file.type || null,
  }
}

/**
 * Accepts either JSON (`{ "payload": { ... } }` or a flat object) or multipart/form-data
 * where text fields are variables and file fields are images. A multipart `payload` field
 * holding a JSON object is merged in too.
 */
export async function parseGenerateRequest(
  request: Request
): Promise<GenerateRequestPayload> {
  const contentType = request.headers.get("content-type") ?? ""
  const payload = emptyPayload()

  if (contentType.includes("multipart/form-data")) {
    let formData: FormData

    try {
      formData = await request.formData()
    } catch {
      throw new TemplateServiceError("Invalid form data", 400, "INVALID_PAYLOAD")
    }

    for (const [name, entry] of formData.entries()) {
      if (entry instanceof File) {
        if (entry.size === 0) {
          continue
        }

        payload.images[name] = await fileToImage(entry, name)
        continue
      }

      if (name === "payload") {
        try {
          const parsed: unknown = JSON.parse(entry)

          if (isRecord(parsed)) {
            applyJsonObject(payload, parsed)
            continue
          }
        } catch {
          // Not JSON - treat "payload" as a plain variable below.
        }
      }

      payload.values[name] = entry
    }

    return payload
  }

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const text = await request.text()

    for (const [name, value] of new URLSearchParams(text).entries()) {
      payload.values[name] = value
    }

    return payload
  }

  const raw = await request.text()

  if (!raw.trim()) {
    return payload
  }

  let body: unknown

  try {
    body = JSON.parse(raw)
  } catch {
    throw new TemplateServiceError("Invalid JSON body", 400, "INVALID_PAYLOAD")
  }

  applyJsonObject(payload, body)

  return payload
}
