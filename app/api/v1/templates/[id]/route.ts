import { NextResponse } from "next/server"

import { authenticateApiRequest } from "@/lib/api/authenticate-api-request"
import { assertRateLimit } from "@/lib/api/rate-limit"
import { handleTemplatesRouteError } from "@/lib/api/templates-route"
import { getTemplateForApiKey } from "@/lib/services/templates/get-template-for-api-key"
import { toPublicTemplate } from "@/lib/services/templates/to-template-record"
import { buildExamplePayload } from "@/lib/templates/variables"

type RouteContext = {
  params: Promise<{ id: string }>
}

/** Public API: template details, variables and an example payload. */
export async function GET(request: Request, context: RouteContext) {
  try {
    const auth = await authenticateApiRequest(request)
    assertRateLimit({
      key: `v1:detail:${auth.userId}`,
      limit: 60,
      windowMs: 60_000,
      userId: auth.userId,
    })

    const { id } = await context.params
    const template = toPublicTemplate(await getTemplateForApiKey(id, auth.userId))

    return NextResponse.json({
      data: {
        ...template,
        example_payload: buildExamplePayload(template.variables),
      },
    })
  } catch (error) {
    return handleTemplatesRouteError(error)
  }
}
