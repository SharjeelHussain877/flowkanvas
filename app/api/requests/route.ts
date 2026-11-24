import { NextResponse } from "next/server"

import { handleTemplatesRouteError } from "@/lib/api/templates-route"
import { listRenderRequests } from "@/lib/services/requests/list-render-requests"

export async function GET() {
  try {
    const data = await listRenderRequests()
    return NextResponse.json({ data })
  } catch (error) {
    return handleTemplatesRouteError(error)
  }
}
