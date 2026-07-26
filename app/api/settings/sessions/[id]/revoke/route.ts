import { handleAuthRouteError } from "@/lib/api/auth-route"
import { revokeSession } from "@/lib/services/sessions/list-sessions"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params

  try {
    const revokedCurrentSession = await revokeSession(id)
    return Response.json({
      data: { success: true as const, revokedCurrentSession },
    })
  } catch (error) {
    return handleAuthRouteError(error)
  }
}
