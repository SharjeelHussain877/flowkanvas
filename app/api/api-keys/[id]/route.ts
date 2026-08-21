import { NextResponse } from "next/server"

import { handleApiKeysRouteError } from "@/lib/api/api-keys-route"
import { deleteApiKey } from "@/lib/services/api-keys/delete-api-key"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params

  if (!id) {
    return NextResponse.json({ error: "API key id is required" }, { status: 400 })
  }

  try {
    const data = await deleteApiKey(id)
    return NextResponse.json({ data })
  } catch (error) {
    return handleApiKeysRouteError(error)
  }
}
