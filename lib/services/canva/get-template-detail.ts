import { canvaApiGet } from "@/lib/canva/api-client"
import type {
  CanvaDataset,
  CanvaDatasetFieldType,
  CanvaDatasetResponse,
  CanvaGetBrandTemplateResponse,
  CanvaGetDesignResponse,
} from "@/lib/canva/types"
import { getCanvaConnectionStatus } from "@/lib/services/canva/connection"
import { extractDesignPlaceholderFields } from "@/lib/services/canva/extract-design-placeholders"
import { CanvaServiceError } from "@/lib/services/canva/errors"
import { requireAuthenticatedUserId } from "@/lib/services/canva/require-user"
import { isCanvaTokenRevokedError } from "@/lib/services/canva/token-revoked"
import type { CanvaTemplateKind } from "@/schemas/canva/templates"
import type {
  CanvaDatasetField,
  CanvaTemplateDetail,
} from "@/schemas/canva/template-detail"

function isDatasetFieldType(value: string): value is CanvaDatasetFieldType {
  return value === "text" || value === "image" || value === "chart"
}

function mapDatasetFields(dataset: CanvaDataset | null | undefined): CanvaDatasetField[] {
  if (!dataset) {
    return []
  }

  return Object.entries(dataset)
    .map(([key, field]) => ({
      key,
      type: isDatasetFieldType(field.type) ? field.type : "text",
    }))
    .sort((left, right) => left.key.localeCompare(right.key))
}

function exampleValueForField(type: CanvaDatasetFieldType) {
  if (type === "image") {
    return {
      type: "image",
      asset_id: "<asset_id>",
    }
  }

  if (type === "chart") {
    return {
      type: "chart",
      chart_data: {},
    }
  }

  return {
    type: "text",
    text: "",
  }
}

function buildExamplePayload(fields: CanvaDatasetField[]) {
  return Object.fromEntries(
    fields.map((field) => [field.key, exampleValueForField(field.type)])
  )
}

function parseKind(value: string | null | undefined): CanvaTemplateKind | null {
  if (value === "design" || value === "brand_template") {
    return value
  }

  return null
}

async function fetchDataset(
  userId: string,
  path: string
): Promise<CanvaDataset | null> {
  try {
    const response = await canvaApiGet<CanvaDatasetResponse>(userId, path)
    return response.dataset ?? null
  } catch (error) {
    if (
      error instanceof CanvaServiceError &&
      (error.status === 404 || error.status === 403 || error.status === 400)
    ) {
      return null
    }

    throw error
  }
}

async function fetchBrandTemplateDetail(
  userId: string,
  id: string
): Promise<CanvaTemplateDetail> {
  const [templateResponse, dataset] = await Promise.all([
    canvaApiGet<CanvaGetBrandTemplateResponse>(
      userId,
      `/brand-templates/${id}`
    ),
    fetchDataset(userId, `/brand-templates/${id}/dataset`),
  ])

  const template = templateResponse.brand_template
  const fields = mapDatasetFields(dataset)

  return {
    id: template.id,
    title: template.title,
    kind: "brand_template",
    thumbnailUrl: template.thumbnail?.url ?? null,
    viewUrl: template.view_url,
    editUrl: template.create_url,
    fields,
    fieldsSource: fields.length > 0 ? "dataset" : "none",
    examplePayload: buildExamplePayload(fields),
  }
}

async function fetchDesignDetail(
  userId: string,
  id: string
): Promise<CanvaTemplateDetail> {
  const [designResponse, dataset] = await Promise.all([
    canvaApiGet<CanvaGetDesignResponse>(userId, `/designs/${id}`),
    fetchDataset(userId, `/designs/${id}/dataset`),
  ])

  const design = designResponse.design
  let fields = mapDatasetFields(dataset)
  let fieldsSource: CanvaTemplateDetail["fieldsSource"] =
    fields.length > 0 ? "dataset" : "none"

  if (fields.length === 0) {
    try {
      const placeholderFields = await extractDesignPlaceholderFields(
        userId,
        id
      )
      if (placeholderFields.length > 0) {
        fields = placeholderFields
        fieldsSource = "placeholders"
      }
    } catch (error) {
      console.error("[canva] placeholder extraction failed", error)
    }
  }

  return {
    id: design.id,
    title: design.title?.trim() || "Untitled design",
    kind: "design",
    thumbnailUrl: design.thumbnail?.url ?? null,
    viewUrl: design.urls.view_url,
    editUrl: design.urls.edit_url,
    fields,
    fieldsSource,
    examplePayload: buildExamplePayload(fields),
  }
}

export async function getCanvaTemplateDetail(
  id: string,
  kindParam?: string | null,
  userId?: string
): Promise<CanvaTemplateDetail> {
  const resolvedUserId = userId ?? (await requireAuthenticatedUserId())
  const connection = await getCanvaConnectionStatus(resolvedUserId)

  if (!connection.connected) {
    throw new CanvaServiceError("Canva is not connected", 404, "NOT_CONNECTED")
  }

  const kind = parseKind(kindParam)

  try {
    if (kind === "design") {
      return await fetchDesignDetail(resolvedUserId, id)
    }

    if (kind === "brand_template") {
      return await fetchBrandTemplateDetail(resolvedUserId, id)
    }

    try {
      return await fetchBrandTemplateDetail(resolvedUserId, id)
    } catch (error) {
      if (error instanceof CanvaServiceError && error.status === 404) {
        return await fetchDesignDetail(resolvedUserId, id)
      }

      throw error
    }
  } catch (error) {
    if (isCanvaTokenRevokedError(error)) {
      throw error
    }

    throw error
  }
}
