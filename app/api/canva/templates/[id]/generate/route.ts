import { NextResponse } from "next/server"

import { assertRateLimit } from "@/lib/api/rate-limit"
import { handleCanvaRouteError } from "@/lib/api/canva-route"
import { generateCanvaPdf } from "@/lib/services/canva/generate-pdf"
import { requireAuthenticatedUserId } from "@/lib/services/canva/require-user"
import { generateCanvaPdfSchema } from "@/schemas/canva/generate-pdf"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const userId = await requireAuthenticatedUserId()
    assertRateLimit({
      key: `canva:generate:${userId}`,
      limit: 8,
      windowMs: 60_000,
      userId,
    })

    const { id } = await context.params
    const kind = new URL(request.url).searchParams.get("kind")
    const body = await request.json().catch(() => ({}))
    const parsed = generateCanvaPdfSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload. Send JSON like { \"payload\": { \"name\": \"Ali\" } }." },
        { status: 400 }
      )
    }

    const result = await generateCanvaPdf({
      userId,
      templateId: id,
      kind: parsed.data.kind ?? kind,
      payload: parsed.data.payload,
    })

    return new NextResponse(new Uint8Array(result.bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${result.filename}"`,
        ...(result.warning ? { "X-Flowkanvas-Warning": result.warning } : {}),
      },
    })
  } catch (error) {
    return handleCanvaRouteError(error)
  }
}
