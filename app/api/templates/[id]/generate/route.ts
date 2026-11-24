import { parseGenerateRequest } from "@/lib/pdf/parse-generate-request"
import {
  handleTemplatesRouteError,
  pdfResponse,
  wantsInlinePdf,
} from "@/lib/api/templates-route"
import { generateTemplatePdf } from "@/lib/services/templates/generate-template-pdf"
import { getTemplate } from "@/lib/services/templates/get-template"
import { requireAuthenticatedUserId } from "@/lib/services/templates/require-user"

type RouteContext = {
  params: Promise<{ id: string }>
}

/** Session-authenticated render used by the in-app API tester. */
export async function POST(request: Request, context: RouteContext) {
  try {
    const userId = await requireAuthenticatedUserId()
    const { id } = await context.params
    const template = await getTemplate(id)
    const payload = await parseGenerateRequest(request)

    const result = await generateTemplatePdf({
      template,
      userId,
      payload,
      source: "playground",
    })

    return pdfResponse(result, wantsInlinePdf(request))
  } catch (error) {
    return handleTemplatesRouteError(error)
  }
}
