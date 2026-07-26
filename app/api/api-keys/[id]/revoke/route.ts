import { NextResponse } from "next/server"

import { handleApiKeysRouteError } from "@/lib/api/api-keys-route"
import { revokeApiKey } from "@/lib/services/api-keys/revoke-api-key"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params

  if (!id) {
    return NextResponse.json({ error: "API key id is required" }, { status: 400 })
  }

  try {
    const data = await revokeApiKey(id)
    return NextResponse.json({ data })
  } catch (error) {
    return handleApiKeysRouteError(error)
  }
}
