import type {
  CanvaBrandTemplate,
  CanvaDesign,
  CanvaThumbnail,
} from "@/lib/canva/types"
import {
  formatCanvaOrientation,
  formatCanvaSize,
  type CanvaDimensions,
} from "@/lib/canva/format-size"
import { getCanvaConnectionStatus } from "@/lib/services/canva/connection"
import { getCanvaDesignDimensionsMap } from "@/lib/services/canva/get-design-dimensions"
import { listCanvaBrandTemplates } from "@/lib/services/canva/list-brand-templates"
import { listCanvaDesigns } from "@/lib/services/canva/list-designs"
import { requireAuthenticatedUserId } from "@/lib/services/canva/require-user"
import type {
  CanvaTemplateListItem,
  CanvaTemplatesPageData,
} from "@/schemas/canva/templates"

function formatUpdatedAt(unixSeconds: number): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(unixSeconds * 1000))
}

function dimensionsFromThumbnail(
  thumbnail: CanvaThumbnail | undefined
): CanvaDimensions | null {
  if (!thumbnail?.width || !thumbnail?.height) {
    return null
  }

  return {
    width: thumbnail.width,
    height: thumbnail.height,
  }
}

function buildSizeFields(dimensions: CanvaDimensions | null) {
  return {
    dimensions,
    sizeLabel: formatCanvaSize(dimensions),
    orientationLabel: formatCanvaOrientation(dimensions),
  }
}

function mapDesign(
  design: CanvaDesign,
  dimensions: CanvaDimensions | null
): CanvaTemplateListItem {
  const sizeFields = buildSizeFields(dimensions)

  return {
    id: design.id,
    title: design.title?.trim() || "Untitled design",
    kind: "design",
    updatedAt: formatUpdatedAt(design.updated_at),
    updatedAtUnix: design.updated_at,
    thumbnailUrl: design.thumbnail?.url ?? null,
    viewUrl: design.urls.view_url,
    editUrl: design.urls.edit_url,
    ...sizeFields,
  }
}

function mapBrandTemplate(template: CanvaBrandTemplate): CanvaTemplateListItem {
  const sizeFields = buildSizeFields(dimensionsFromThumbnail(template.thumbnail))

  return {
    id: template.id,
    title: template.title,
    kind: "brand_template",
    updatedAt: formatUpdatedAt(template.updated_at),
    updatedAtUnix: template.updated_at,
    thumbnailUrl: template.thumbnail?.url ?? null,
    viewUrl: template.view_url,
    editUrl: template.create_url,
    ...sizeFields,
  }
}

export async function getCanvaTemplatesPageData(): Promise<CanvaTemplatesPageData> {
  const userId = await requireAuthenticatedUserId()
  const connection = await getCanvaConnectionStatus()

  if (!connection.connected) {
    return {
      connected: false,
      items: [],
      brandTemplatesError: null,
    }
  }

  const designsResult = await listCanvaDesigns(userId)
  const designDimensions = await getCanvaDesignDimensionsMap(
    userId,
    designsResult.map((design) => design.id)
  )

  const items = designsResult.map((design) =>
    mapDesign(design, designDimensions.get(design.id) ?? null)
  )

  let brandTemplatesError: string | null = null

  try {
    const brandTemplates = await listCanvaBrandTemplates(userId)
    items.push(...brandTemplates.map(mapBrandTemplate))
  } catch (error) {
    brandTemplatesError =
      error instanceof Error ? error.message : "Could not load brand templates"
  }

  items.sort((left, right) => right.updatedAtUnix - left.updatedAtUnix)

  return {
    connected: true,
    items,
    brandTemplatesError,
  }
}
