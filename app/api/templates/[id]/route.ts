import { NextResponse } from "next/server"

import { handleTemplatesRouteError } from "@/lib/api/templates-route"
import { deleteTemplate } from "@/lib/services/templates/delete-template"
import { getTemplate } from "@/lib/services/templates/get-template"
import { updateTemplate } from "@/lib/services/templates/update-template"
import { updateTemplateSchema } from "@/schemas/templates/template"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const data = await getTemplate(id)
    return NextResponse.json({ data })
  } catch (error) {
    return handleTemplatesRouteError(error)
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = updateTemplateSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Template design is invalid", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  try {
    const { id } = await context.params
    const data = await updateTemplate(id, parsed.data)
    return NextResponse.json({ data })
  } catch (error) {
    return handleTemplatesRouteError(error)
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const data = await deleteTemplate(id)
    return NextResponse.json({ data })
  } catch (error) {
    return handleTemplatesRouteError(error)
  }
}
