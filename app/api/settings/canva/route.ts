import { NextResponse } from "next/server"

import { assertRateLimit } from "@/lib/api/rate-limit"
import { handleCanvaRouteError } from "@/lib/api/canva-route"
import { disconnectCanvaConnection } from "@/lib/services/canva/access-token"
import { getCanvaConnectionStatus } from "@/lib/services/canva/connection"
import { requireAuthenticatedUserId } from "@/lib/services/canva/require-user"

export async function GET() {
  try {
    const userId = await requireAuthenticatedUserId()
    assertRateLimit({
      key: `canva:settings:${userId}`,
      limit: 60,
      windowMs: 60_000,
      userId,
    })

    const data = await getCanvaConnectionStatus()
    return NextResponse.json({ data })
  } catch (error) {
    return handleCanvaRouteError(error)
  }
}

export async function DELETE() {
  try {
    const userId = await requireAuthenticatedUserId()
    assertRateLimit({
      key: `canva:disconnect:${userId}`,
      limit: 10,
      windowMs: 60_000,
      userId,
    })

    await disconnectCanvaConnection()
    return NextResponse.json({ data: { connected: false } })
  } catch (error) {
    return handleCanvaRouteError(error)
  }
}
