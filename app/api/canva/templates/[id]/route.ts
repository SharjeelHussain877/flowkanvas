import { NextResponse } from "next/server"

import { assertRateLimit } from "@/lib/api/rate-limit"
import { handleCanvaRouteError } from "@/lib/api/canva-route"
import { getCanvaTemplateDetail } from "@/lib/services/canva/get-template-detail"
import { requireAuthenticatedUserId } from "@/lib/services/canva/require-user"

type CanvaTemplateDetailRouteProps = {
  params: Promise<{ id: string }>
}

export async function GET(
  request: Request,
  { params }: CanvaTemplateDetailRouteProps
) {
  try {
    const userId = await requireAuthenticatedUserId()
    assertRateLimit({
      key: `canva:template-detail:${userId}`,
      limit: 30,
      windowMs: 60_000,
      userId,
    })

    const { id } = await params
    const kind = new URL(request.url).searchParams.get("kind")
    const data = await getCanvaTemplateDetail(id, kind)

    return NextResponse.json({ data })
  } catch (error) {
    return handleCanvaRouteError(error)
  }
}
