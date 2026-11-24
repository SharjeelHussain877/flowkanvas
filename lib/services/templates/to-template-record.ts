import { createEmptyDesign } from "@/lib/templates/element-defaults"
import { extractTemplateVariables } from "@/lib/templates/variables"
import { templateDesignSchema } from "@/schemas/templates/design"
import type { PublicTemplate, TemplateRecord } from "@/schemas/templates/template"
import type { TemplateRow } from "@/types/supabase"

export function toTemplateRecord(row: TemplateRow): TemplateRecord {
  const parsed = templateDesignSchema.safeParse(row.design)
  const width = Number(row.width)
  const height = Number(row.height)

  return {
    id: row.id,
    name: row.name,
    width,
    height,
    design: parsed.success ? parsed.data : createEmptyDesign(width, height),
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export function toPublicTemplate(record: TemplateRecord): PublicTemplate {
  return {
    id: record.id,
    name: record.name,
    width: record.width,
    height: record.height,
    variables: extractTemplateVariables(record.design),
    updated_at: record.updated_at,
  }
}
