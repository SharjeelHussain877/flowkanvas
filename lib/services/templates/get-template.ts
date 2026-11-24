import { createClient } from "@/lib/supabase/server"
import {
  mapSupabaseTemplateError,
  TemplateServiceError,
} from "@/lib/services/templates/errors"
import { requireAuthenticatedUserId } from "@/lib/services/templates/require-user"
import { toTemplateRecord } from "@/lib/services/templates/to-template-record"
import type { TemplateRecord } from "@/schemas/templates/template"

export async function getTemplate(id: string): Promise<TemplateRecord> {
  await requireAuthenticatedUserId()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("templates")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (error) {
    throw mapSupabaseTemplateError(error, "Failed to load template", "GET_FAILED")
  }

  if (!data) {
    throw new TemplateServiceError("Template not found", 404, "NOT_FOUND")
  }

  return toTemplateRecord(data)
}
