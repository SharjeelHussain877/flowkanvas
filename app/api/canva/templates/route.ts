import { NextResponse } from "next/server"

import { assertRateLimit } from "@/lib/api/rate-limit"
import { handleCanvaRouteError } from "@/lib/api/canva-route"
import { getCanvaTemplatesPageData } from "@/lib/services/canva/get-templates-page-data"
import { requireAuthenticatedUserId } from "@/lib/services/canva/require-user"

export async function GET() {
  try {
    const userId = await requireAuthenticatedUserId()
    assertRateLimit({
      key: `canva:templates:${userId}`,
      limit: 30,
      windowMs: 60_000,
      userId,
    })

    const data = await getCanvaTemplatesPageData()
    return NextResponse.json({ data })
  } catch (error) {
    return handleCanvaRouteError(error)
  }
}
