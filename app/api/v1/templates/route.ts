import { NextResponse } from "next/server"

import { authenticateApiRequest } from "@/lib/api/authenticate-api-request"
import { assertRateLimit } from "@/lib/api/rate-limit"
import { handleTemplatesRouteError } from "@/lib/api/templates-route"
import { listTemplatesForApiKey } from "@/lib/services/templates/get-template-for-api-key"
import { toPublicTemplate } from "@/lib/services/templates/to-template-record"

/** Public API: list the caller's templates with their variables. */
export async function GET(request: Request) {
  try {
    const auth = await authenticateApiRequest(request)
    assertRateLimit({
      key: `v1:list:${auth.userId}`,
      limit: 60,
      windowMs: 60_000,
      userId: auth.userId,
    })

    const templates = await listTemplatesForApiKey(auth.userId)
    return NextResponse.json({ data: templates.map(toPublicTemplate) })
  } catch (error) {
    return handleTemplatesRouteError(error)
  }
}
