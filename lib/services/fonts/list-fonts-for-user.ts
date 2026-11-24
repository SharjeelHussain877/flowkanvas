import { isMissingFontsTable, mapSupabaseFontError } from "@/lib/services/fonts/errors"
import { toFontRecord } from "@/lib/services/fonts/to-font-record"
import { createAdminClient } from "@/lib/supabase/admin"
import type { FontRecord } from "@/schemas/fonts/font"

/**
 * Fonts for the PDF renderer. API-key requests have no session, so the admin client is used
 * and scoped by user id. A missing table (migration not applied) yields no fonts instead of failing.
 */
export async function listFontsForUser(userId: string): Promise<FontRecord[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("template_fonts")
    .select("*")
    .eq("user_id", userId)

  if (error) {
    if (isMissingFontsTable(error)) {
      return []
    }

    throw mapSupabaseFontError(error, "Failed to load fonts", "LIST_FAILED")
  }

  return (data ?? []).map(toFontRecord)
}
