import { TemplateServiceError } from "@/lib/services/templates/errors"
import { getAllElements } from "@/lib/templates/design"
import type { TemplateDesign } from "@/schemas/templates/design"
import {
  MAX_IMAGE_BYTES,
  type GeneratePayloadImage,
} from "@/schemas/templates/generate"

export type ResolvedImage = {
  data: Buffer
  format: "png" | "jpg"
}

export type ResolvedDesignImages = {
  /** Keyed by element id. */
  byElement: Map<string, ResolvedImage>
  warnings: string[]
}

const FETCH_TIMEOUT_MS = 10_000

export function detectImageFormat(bytes: Uint8Array): ResolvedImage["format"] | null {
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "png"
  }

  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "jpg"
  }

  return null
}

function isPrivateHostname(hostname: string): boolean {
  const host = hostname.toLowerCase()

  if (host === "localhost" || host.endsWith(".localhost") || host === "0.0.0.0") {
    return true
  }

  if (host === "::1" || host.startsWith("[::1]") || host.startsWith("fe80:") || host.startsWith("fc") || host.startsWith("fd")) {
    return true
  }

  const ipv4 = host.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/)

  if (!ipv4) {
    return false
  }

  const [a, b] = [Number(ipv4[1]), Number(ipv4[2])]

  return (
    a === 10 ||
    a === 127 ||
    a === 0 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  )
}

function decodeDataUri(uri: string): Uint8Array | null {
  const match = uri.match(/^data:([^;,]+)?(;base64)?,([\s\S]*)$/)

  if (!match) {
    return null
  }

  const isBase64 = Boolean(match[2])
  const payload = match[3] ?? ""

  try {
    return isBase64
      ? new Uint8Array(Buffer.from(payload, "base64"))
      : new Uint8Array(Buffer.from(decodeURIComponent(payload), "binary"))
  } catch {
    return null
  }
}

async function fetchImageBytes(url: string, label: string): Promise<Uint8Array> {
  let parsed: URL

  try {
    parsed = new URL(url)
  } catch {
    throw new TemplateServiceError(`"${label}" is not a valid image URL`, 400, "INVALID_IMAGE")
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new TemplateServiceError(
      `"${label}" must be an http(s) URL or a data URI`,
      400,
      "INVALID_IMAGE"
    )
  }

  if (isPrivateHostname(parsed.hostname)) {
    throw new TemplateServiceError(
      `"${label}" points to a private network address`,
      400,
      "INVALID_IMAGE"
    )
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(parsed, {
      signal: controller.signal,
      cache: "no-store",
      redirect: "follow",
    })

    if (!response.ok) {
      throw new TemplateServiceError(
        `Could not download "${label}" (HTTP ${response.status})`,
        400,
        "IMAGE_DOWNLOAD_FAILED"
      )
    }

    const declaredLength = Number(response.headers.get("content-length") ?? 0)

    if (declaredLength > MAX_IMAGE_BYTES) {
      throw new TemplateServiceError(
        `"${label}" is larger than ${MAX_IMAGE_BYTES / (1024 * 1024)} MB`,
        400,
        "IMAGE_TOO_LARGE"
      )
    }

    const bytes = new Uint8Array(await response.arrayBuffer())

    if (bytes.byteLength > MAX_IMAGE_BYTES) {
      throw new TemplateServiceError(
        `"${label}" is larger than ${MAX_IMAGE_BYTES / (1024 * 1024)} MB`,
        400,
        "IMAGE_TOO_LARGE"
      )
    }

    return bytes
  } catch (error) {
    if (error instanceof TemplateServiceError) {
      throw error
    }

    throw new TemplateServiceError(
      `Could not download "${label}"`,
      400,
      "IMAGE_DOWNLOAD_FAILED",
      error instanceof Error ? error.message : undefined
    )
  } finally {
    clearTimeout(timeout)
  }
}

function toResolvedImage(bytes: Uint8Array, label: string): ResolvedImage {
  if (bytes.byteLength > MAX_IMAGE_BYTES) {
    throw new TemplateServiceError(
      `"${label}" is larger than ${MAX_IMAGE_BYTES / (1024 * 1024)} MB`,
      400,
      "IMAGE_TOO_LARGE"
    )
  }

  const format = detectImageFormat(bytes)

  if (!format) {
    throw new TemplateServiceError(
      `"${label}" must be a PNG or JPEG image`,
      400,
      "INVALID_IMAGE"
    )
  }

  return { data: Buffer.from(bytes), format }
}

async function resolveSource(source: string, label: string): Promise<ResolvedImage> {
  if (source.startsWith("data:")) {
    const bytes = decodeDataUri(source)

    if (!bytes) {
      throw new TemplateServiceError(`"${label}" is not a valid data URI`, 400, "INVALID_IMAGE")
    }

    return toResolvedImage(bytes, label)
  }

  return toResolvedImage(await fetchImageBytes(source, label), label)
}

async function resolvePayloadImage(
  image: GeneratePayloadImage,
  label: string
): Promise<ResolvedImage> {
  if (image.kind === "bytes") {
    return toResolvedImage(image.data, label)
  }

  return resolveSource(image.url, label)
}

/**
 * Loads every image the design needs: variable images from the request payload,
 * static images from their stored URL. Payload problems are the caller's error (400);
 * a static asset that fails to load is skipped with a warning.
 */
export async function resolveDesignImages(
  design: TemplateDesign,
  images: Record<string, GeneratePayloadImage>,
  values: Record<string, string>
): Promise<ResolvedDesignImages> {
  const byElement = new Map<string, ResolvedImage>()
  const warnings: string[] = []
  const staticCache = new Map<string, Promise<ResolvedImage>>()
  const variableCache = new Map<string, Promise<ResolvedImage>>()

  const tasks = getAllElements(design).flatMap((element) => {
    if (element.type !== "image") {
      return []
    }

    return [
      (async () => {
        if (element.variable) {
          const name = element.variable
          const payloadImage = images[name]
          const payloadValue = values[name]?.trim()

          if (!payloadImage && !payloadValue) {
            if (element.src) {
              let fallback = staticCache.get(element.src)

              if (!fallback) {
                fallback = resolveSource(element.src, "template image")
                staticCache.set(element.src, fallback)
              }

              try {
                byElement.set(element.id, await fallback)
              } catch {
                // Placeholder image is optional - leave the slot empty.
              }
            }

            return
          }

          let pending = variableCache.get(name)

          if (!pending) {
            pending = payloadImage
              ? resolvePayloadImage(payloadImage, name)
              : resolveSource(payloadValue as string, name)
            variableCache.set(name, pending)
          }

          byElement.set(element.id, await pending)
          return
        }

        if (!element.src) {
          return
        }

        let pending = staticCache.get(element.src)

        if (!pending) {
          pending = resolveSource(element.src, "template image")
          staticCache.set(element.src, pending)
        }

        try {
          byElement.set(element.id, await pending)
        } catch (error) {
          warnings.push(
            error instanceof Error
              ? `A template image could not be loaded and was skipped (${error.message}).`
              : "A template image could not be loaded and was skipped."
          )
        }
      })(),
    ]
  })

  await Promise.all(tasks)

  return { byElement, warnings }
}
