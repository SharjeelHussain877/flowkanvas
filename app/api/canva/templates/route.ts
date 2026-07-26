import { NextResponse } from "next/server"

import { handleCanvaRouteError } from "@/lib/api/canva-route"
import { getCanvaTemplatesPageData } from "@/lib/services/canva/get-templates-page-data"

export async function GET() {
  try {
    const data = await getCanvaTemplatesPageData()
    return NextResponse.json({ data })
  } catch (error) {
    return handleCanvaRouteError(error)
  }
}
