export type CanvaTemplateKind = "design" | "brand_template"

export type CanvaTemplateDimensions = {
  width: number
  height: number
}

export type CanvaTemplateListItem = {
  id: string
  title: string
  kind: CanvaTemplateKind
  updatedAt: string
  updatedAtUnix: number
  thumbnailUrl: string | null
  viewUrl: string
  editUrl: string | null
  dimensions: CanvaTemplateDimensions | null
  sizeLabel: string | null
  orientationLabel: string | null
}

export type CanvaTemplatesPageData = {
  connected: boolean
  items: CanvaTemplateListItem[]
  brandTemplatesError: string | null
}

export type CanvaTemplatesApiResponse = {
  data: CanvaTemplatesPageData
}
