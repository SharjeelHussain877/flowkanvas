import { NextResponse } from "next/server"

import { handleTemplatesRouteError } from "@/lib/api/templates-route"
import { deleteAsset } from "@/lib/services/assets/delete-asset"

type RouteContext = {
  params: Promise<{ name: string }>
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { name } = await context.params
    const data = await deleteAsset(decodeURIComponent(name))
    return NextResponse.json({ data })
  } catch (error) {
    return handleTemplatesRouteError(error)
  }
}
