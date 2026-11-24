import { createClient } from "@/lib/supabase/server"
import { mapSupabaseTemplateError } from "@/lib/services/templates/errors"
import { requireAuthenticatedUserId } from "@/lib/services/templates/require-user"
import { toTemplateRecord } from "@/lib/services/templates/to-template-record"
import { createEmptyDesign } from "@/lib/templates/element-defaults"
import type {
  CreateTemplateInput,
  TemplateRecord,
} from "@/schemas/templates/template"

export async function createTemplate(
  input: CreateTemplateInput
): Promise<TemplateRecord> {
  const userId = await requireAuthenticatedUserId()
  const supabase = await createClient()
  const width = Math.round(input.width)
  const height = Math.round(input.height)

  const { data, error } = await supabase
    .from("templates")
    .insert({
      user_id: userId,
      name: input.name.trim(),
      width,
      height,
      design: createEmptyDesign(width, height),
    })
    .select("*")
    .single()

  if (error || !data) {
    throw mapSupabaseTemplateError(
      error ?? { message: "No row returned after insert" },
      "Failed to create template",
      "CREATE_FAILED"
    )
  }

  return toTemplateRecord(data)
}
