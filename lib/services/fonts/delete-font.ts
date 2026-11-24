import { mapSupabaseFontError } from "@/lib/services/fonts/errors"
import { FONT_BUCKET } from "@/lib/services/fonts/to-font-record"
import { TemplateServiceError } from "@/lib/services/templates/errors"
import { requireAuthenticatedUserId } from "@/lib/services/templates/require-user"
import { createClient } from "@/lib/supabase/server"

export async function deleteFont(id: string): Promise<{ id: string }> {
  await requireAuthenticatedUserId()
  const supabase = await createClient()

  const { data: row, error: lookupError } = await supabase
    .from("template_fonts")
    .select("id, storage_path")
    .eq("id", id)
    .maybeSingle()

  if (lookupError) {
    throw mapSupabaseFontError(lookupError, "Failed to delete font", "DELETE_FAILED")
  }

  if (!row) {
    throw new TemplateServiceError("Font not found", 404, "NOT_FOUND")
  }

  const { error } = await supabase.from("template_fonts").delete().eq("id", id)

  if (error) {
    throw mapSupabaseFontError(error, "Failed to delete font", "DELETE_FAILED")
  }

  await supabase.storage.from(FONT_BUCKET).remove([row.storage_path])

  return { id: row.id }
}
