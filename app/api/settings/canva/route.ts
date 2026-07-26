import { NextResponse } from "next/server"

import { handleCanvaRouteError } from "@/lib/api/canva-route"
import { disconnectCanvaConnection } from "@/lib/services/canva/access-token"
import { getCanvaConnectionStatus } from "@/lib/services/canva/connection"

export async function GET() {
  try {
    const data = await getCanvaConnectionStatus()
    return NextResponse.json({ data })
  } catch (error) {
    return handleCanvaRouteError(error)
  }
}

export async function DELETE() {
  try {
    await disconnectCanvaConnection()
    return NextResponse.json({ data: { connected: false } })
  } catch (error) {
    return handleCanvaRouteError(error)
  }
}
