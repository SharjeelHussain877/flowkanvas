import { createClient } from "@/lib/supabase/server"
import {
  mapSupabaseTemplateError,
  TemplateServiceError,
} from "@/lib/services/templates/errors"
import { requireAuthenticatedUserId } from "@/lib/services/templates/require-user"
import { toTemplateRecord } from "@/lib/services/templates/to-template-record"
import type {
  TemplateRecord,
  UpdateTemplateInput,
} from "@/schemas/templates/template"
import type { Database } from "@/types/supabase"

type TemplateUpdate = Database["public"]["Tables"]["templates"]["Update"]

export async function updateTemplate(
  id: string,
  input: UpdateTemplateInput
): Promise<TemplateRecord> {
  await requireAuthenticatedUserId()
  const supabase = await createClient()

  const patch: TemplateUpdate = {}

  if (input.name !== undefined) {
    patch.name = input.name.trim()
  }

  if (input.design !== undefined) {
    patch.design = input.design
    patch.width = input.design.width
    patch.height = input.design.height
  }

  const { data, error } = await supabase
    .from("templates")
    .update(patch)
    .eq("id", id)
    .select("*")
    .maybeSingle()

  if (error) {
    throw mapSupabaseTemplateError(error, "Failed to save template", "UPDATE_FAILED")
  }

  if (!data) {
    throw new TemplateServiceError("Template not found", 404, "NOT_FOUND")
  }

  return toTemplateRecord(data)
}
