import { NextResponse } from "next/server"

import { handleApiKeysRouteError } from "@/lib/api/api-keys-route"
import { createApiKeySchema } from "@/schemas/api-keys/create-api-key"
import { createApiKey } from "@/lib/services/api-keys/create-api-key"
import { getApiKeys } from "@/lib/services/api-keys/get-api-keys"

export async function GET() {
  try {
    const data = await getApiKeys()
    return NextResponse.json({ data })
  } catch (error) {
    return handleApiKeysRouteError(error)
  }
}

export async function POST(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = createApiKeySchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  try {
    const data = await createApiKey(parsed.data)
    return NextResponse.json({ data })
  } catch (error) {
    return handleApiKeysRouteError(error)
  }
}
