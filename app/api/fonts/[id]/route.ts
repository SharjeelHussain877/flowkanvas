import { NextResponse } from "next/server"

import { handleTemplatesRouteError } from "@/lib/api/templates-route"
import { deleteFont } from "@/lib/services/fonts/delete-font"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const data = await deleteFont(id)
    return NextResponse.json({ data })
  } catch (error) {
    return handleTemplatesRouteError(error)
  }
}
