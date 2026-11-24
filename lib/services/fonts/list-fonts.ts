import { mapSupabaseFontError } from "@/lib/services/fonts/errors"
import { toFontRecord } from "@/lib/services/fonts/to-font-record"
import { requireAuthenticatedUserId } from "@/lib/services/templates/require-user"
import { createClient } from "@/lib/supabase/server"
import type { FontRecord } from "@/schemas/fonts/font"

export async function listFonts(): Promise<FontRecord[]> {
  await requireAuthenticatedUserId()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("template_fonts")
    .select("*")
    .order("name", { ascending: true })
    .order("weight", { ascending: true })
    .order("style", { ascending: true })

  if (error) {
    throw mapSupabaseFontError(error, "Failed to load fonts", "LIST_FAILED")
  }

  return (data ?? []).map(toFontRecord)
}
