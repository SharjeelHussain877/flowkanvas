import { assertTemplateAccess } from "@/lib/services/api-keys/assert-template-access"
import {
  mapSupabaseTemplateError,
  TemplateServiceError,
} from "@/lib/services/templates/errors"
import { toTemplateRecord } from "@/lib/services/templates/to-template-record"
import { createAdminClient } from "@/lib/supabase/admin"
import type { TemplateRecord } from "@/schemas/templates/template"

/** API-key requests have no Supabase session, so RLS cannot scope rows - ownership is asserted here. */
export async function getTemplateForApiKey(
  templateId: string,
  apiKeyUserId: string
): Promise<TemplateRecord> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("templates")
    .select("*")
    .eq("id", templateId)
    .maybeSingle()

  if (error) {
    throw mapSupabaseTemplateError(error, "Failed to load template", "GET_FAILED")
  }

  if (!data) {
    throw new TemplateServiceError("Template not found", 404, "NOT_FOUND")
  }

  assertTemplateAccess(data.user_id, apiKeyUserId)

  return toTemplateRecord(data)
}

export async function listTemplatesForApiKey(
  apiKeyUserId: string
): Promise<TemplateRecord[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("templates")
    .select("*")
    .eq("user_id", apiKeyUserId)
    .order("updated_at", { ascending: false })

  if (error) {
    throw mapSupabaseTemplateError(error, "Failed to load templates", "LIST_FAILED")
  }

  return (data ?? []).map(toTemplateRecord)
}
