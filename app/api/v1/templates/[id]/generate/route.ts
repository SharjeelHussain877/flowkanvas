import { authenticateApiRequest } from "@/lib/api/authenticate-api-request"
import { assertRateLimit } from "@/lib/api/rate-limit"
import {
  handleTemplatesRouteError,
  pdfResponse,
  wantsInlinePdf,
} from "@/lib/api/templates-route"
import { parseGenerateRequest } from "@/lib/pdf/parse-generate-request"
import { generateTemplatePdf } from "@/lib/services/templates/generate-template-pdf"
import { getTemplateForApiKey } from "@/lib/services/templates/get-template-for-api-key"

type RouteContext = {
  params: Promise<{ id: string }>
}

/**
 * Public API: render a template to PDF.
 * Body: JSON `{ "payload": { "name": "Ali", "photo": "https://..." } }` or
 * multipart/form-data with text fields for variables and file fields for images.
 */
export async function POST(request: Request, context: RouteContext) {
  try {
    const auth = await authenticateApiRequest(request)
    assertRateLimit({
      key: `v1:generate:${auth.userId}`,
      limit: 30,
      windowMs: 60_000,
      userId: auth.userId,
    })

    const { id } = await context.params
    const template = await getTemplateForApiKey(id, auth.userId)
    const payload = await parseGenerateRequest(request)

    const result = await generateTemplatePdf({
      template,
      userId: auth.userId,
      payload,
      source: "api",
    })

    return pdfResponse(result, wantsInlinePdf(request))
  } catch (error) {
    return handleTemplatesRouteError(error)
  }
}
