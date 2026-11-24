import { createClient } from "@/lib/supabase/server"
import { mapSupabaseTemplateError } from "@/lib/services/templates/errors"
import { requireAuthenticatedUserId } from "@/lib/services/templates/require-user"
import { toTemplateRecord } from "@/lib/services/templates/to-template-record"
import type { TemplateRecord } from "@/schemas/templates/template"

export async function listTemplates(): Promise<TemplateRecord[]> {
  await requireAuthenticatedUserId()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("templates")
    .select("*")
    .order("updated_at", { ascending: false })

  if (error) {
    throw mapSupabaseTemplateError(error, "Failed to load templates", "LIST_FAILED")
  }

  return (data ?? []).map(toTemplateRecord)
}
