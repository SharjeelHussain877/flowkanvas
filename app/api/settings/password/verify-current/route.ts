import { handleAuthRouteError } from "@/lib/api/auth-route"
import { verifyCurrentPasswordSchema } from "@/schemas/settings/change-password"
import { verifyCurrentPassword } from "@/lib/services/settings/verify-current-password"

export async function POST(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = verifyCurrentPasswordSchema.safeParse(body)

  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  try {
    const result = await verifyCurrentPassword(parsed.data.currentPassword)
    return Response.json(result)
  } catch (error) {
    return handleAuthRouteError(error)
  }
}
