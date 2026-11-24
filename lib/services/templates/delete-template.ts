import { createClient } from "@/lib/supabase/server"
import {
  mapSupabaseTemplateError,
  TemplateServiceError,
} from "@/lib/services/templates/errors"
import { requireAuthenticatedUserId } from "@/lib/services/templates/require-user"

export async function deleteTemplate(id: string): Promise<{ id: string }> {
  await requireAuthenticatedUserId()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("templates")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle()

  if (error) {
    throw mapSupabaseTemplateError(error, "Failed to delete template", "DELETE_FAILED")
  }

  if (!data) {
    throw new TemplateServiceError("Template not found", 404, "NOT_FOUND")
  }

  return { id: data.id }
}
