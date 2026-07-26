export type CanvaThumbnail = {
  width: number
  height: number
  url: string
}

export type CanvaDesignLinks = {
  edit_url: string
  view_url: string
}

export type CanvaDesign = {
  id: string
  title?: string
  thumbnail?: CanvaThumbnail
  urls: CanvaDesignLinks
  created_at: number
  updated_at: number
  page_count?: number
  design_types?: string[]
}

export type CanvaBrandTemplate = {
  id: string
  title: string
  view_url: string
  create_url: string
  thumbnail?: CanvaThumbnail
  created_at: number
  updated_at: number
}

export type CanvaListDesignsResponse = {
  items: CanvaDesign[]
  continuation?: string
}

export type CanvaListBrandTemplatesResponse = {
  items: CanvaBrandTemplate[]
  continuation?: string
}

export type CanvaApiErrorBody = {
  code?: string
  message?: string
}
