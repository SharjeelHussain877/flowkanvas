import type { CanvaTemplateKind } from "@/schemas/canva/templates"

export type CanvaDatasetFieldType = "text" | "image" | "chart"

export type CanvaDatasetField = {
  key: string
  type: CanvaDatasetFieldType
}

export type CanvaTemplateDetail = {
  id: string
  title: string
  kind: CanvaTemplateKind
  thumbnailUrl: string | null
  viewUrl: string | null
  editUrl: string | null
  fields: CanvaDatasetField[]
  fieldsSource: "dataset" | "placeholders" | "none"
  examplePayload: Record<string, unknown>
}

export type CanvaTemplateDetailApiResponse = {
  data: CanvaTemplateDetail
}
