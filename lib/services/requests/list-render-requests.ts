import { createClient } from "@/lib/supabase/server"
import {
  mapSupabaseTemplateError,
  TemplateServiceError,
} from "@/lib/services/templates/errors"
import type {
  RenderRequestRecord,
  RenderRequestSource,
  RenderRequestStatus,
} from "@/schemas/requests/render-request"

const DEFAULT_LIMIT = 50

export async function listRenderRequests(
  limit = DEFAULT_LIMIT
): Promise<RenderRequestRecord[]> {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new TemplateServiceError("Unauthorized", 401, "UNAUTHORIZED")
  }

  const { data, error } = await supabase
    .from("render_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    throw mapSupabaseTemplateError(error, "Failed to load requests", "LIST_FAILED")
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    template_id: row.template_id,
    template_name: row.template_name,
    status: row.status as RenderRequestStatus,
    source: row.source as RenderRequestSource,
    duration_ms: row.duration_ms,
    error: row.error,
    created_at: row.created_at,
  }))
}
