import { createClient } from "@/lib/supabase/server"
import {
  mapSupabaseTemplateError,
  TemplateServiceError,
} from "@/lib/services/templates/errors"
import { requireAuthenticatedUserId } from "@/lib/services/templates/require-user"
import { toTemplateRecord } from "@/lib/services/templates/to-template-record"
import { createEmptyDesign } from "@/lib/templates/element-defaults"
import { findStarterTemplate } from "@/lib/templates/starters"
import type { TemplateDesign } from "@/schemas/templates/design"
import {
  BLANK_STARTER_ID,
  type CreateTemplateInput,
  type TemplateRecord,
} from "@/schemas/templates/template"

function buildInitialDesign(input: CreateTemplateInput): TemplateDesign {
  if (input.starter && input.starter !== BLANK_STARTER_ID) {
    const starter = findStarterTemplate(input.starter)

    if (!starter) {
      throw new TemplateServiceError("Unknown starter template", 400, "INVALID_STARTER")
    }

    return starter.build()
  }

  return createEmptyDesign(Math.round(input.width), Math.round(input.height))
}

export async function createTemplate(
  input: CreateTemplateInput
): Promise<TemplateRecord> {
  const userId = await requireAuthenticatedUserId()
  const supabase = await createClient()
  const design = buildInitialDesign(input)

  const { data, error } = await supabase
    .from("templates")
    .insert({
      user_id: userId,
      name: input.name.trim(),
      width: design.width,
      height: design.height,
      design,
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
