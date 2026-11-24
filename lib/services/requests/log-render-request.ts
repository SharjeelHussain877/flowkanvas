import { createAdminClient } from "@/lib/supabase/admin"
import type {
  RenderRequestSource,
  RenderRequestStatus,
} from "@/schemas/requests/render-request"

type LogRenderRequestInput = {
  userId: string
  templateId: string | null
  templateName: string
  status: RenderRequestStatus
  source: RenderRequestSource
  durationMs: number
  error?: string | null
}

/** Best-effort activity log - never fails the PDF response. */
export async function logRenderRequest(input: LogRenderRequestInput): Promise<void> {
  try {
    const supabase = createAdminClient()
    const { error } = await supabase.from("render_requests").insert({
      user_id: input.userId,
      template_id: input.templateId,
      template_name: input.templateName,
      status: input.status,
      source: input.source,
      duration_ms: Math.max(0, Math.round(input.durationMs)),
      error: input.error ? input.error.slice(0, 500) : null,
    })

    if (error && process.env.NODE_ENV === "development") {
      console.warn("[logRenderRequest] insert failed:", error.message)
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[logRenderRequest] failed:", error)
    }
  }
}
