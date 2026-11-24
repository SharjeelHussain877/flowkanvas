export type RenderRequestStatus = "success" | "failed"
export type RenderRequestSource = "api" | "playground"

export type RenderRequestRecord = {
  id: string
  template_id: string | null
  template_name: string
  status: RenderRequestStatus
  source: RenderRequestSource
  duration_ms: number
  error: string | null
  created_at: string
}

export type RenderRequestsListResponse = {
  data: RenderRequestRecord[]
}
