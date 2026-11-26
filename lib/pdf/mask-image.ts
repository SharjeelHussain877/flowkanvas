import sharp from "sharp"

import type { ResolvedImage } from "@/lib/pdf/resolve-images"
import { shapeMaskSvg } from "@/lib/templates/shapes"
import type { ImageElement } from "@/schemas/templates/design"

/** Output pixels per design unit; keeps masked images crisp at print size without huge buffers. */
const PIXEL_SCALE = 3
const MAX_SIDE = 2400

const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 }

/**
 * Fits the image into the element box (cover / contain / fill) and cuts it to the element's
 * shape with an alpha mask. react-pdf can only clip images to rounded rectangles, so other
 * shapes are baked into the pixels before rendering.
 */
export async function maskImageToShape(
  image: ResolvedImage,
  element: ImageElement
): Promise<ResolvedImage> {
  const scale = Math.min(PIXEL_SCALE, MAX_SIDE / Math.max(element.width, element.height))
  const width = Math.max(1, Math.round(element.width * scale))
  const height = Math.max(1, Math.round(element.height * scale))

  const fitted = await sharp(image.data)
    .rotate()
    .resize(width, height, { fit: element.fit, background: TRANSPARENT })
    .ensureAlpha()
    .toBuffer()

  const mask = Buffer.from(shapeMaskSvg(element.shape, width, height))

  const data = await sharp(fitted)
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer()

  return { data, format: "png" }
}
