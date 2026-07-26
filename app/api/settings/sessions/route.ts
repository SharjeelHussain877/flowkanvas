import { handleAuthRouteError } from "@/lib/api/auth-route"
import { listUserSessions } from "@/lib/services/sessions/list-sessions"

export async function GET() {
  try {
    const data = await listUserSessions()
    return Response.json({ data })
  } catch (error) {
    return handleAuthRouteError(error)
  }
}
