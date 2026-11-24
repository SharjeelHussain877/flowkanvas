import { NextResponse } from "next/server"

import { handleTemplatesRouteError } from "@/lib/api/templates-route"
import { createTemplate } from "@/lib/services/templates/create-template"
import { listTemplates } from "@/lib/services/templates/list-templates"
import { createTemplateSchema } from "@/schemas/templates/template"

export async function GET() {
  try {
    const data = await listTemplates()
    return NextResponse.json({ data })
  } catch (error) {
    return handleTemplatesRouteError(error)
  }
}

export async function POST(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = createTemplateSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  try {
    const data = await createTemplate(parsed.data)
    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    return handleTemplatesRouteError(error)
  }
}
