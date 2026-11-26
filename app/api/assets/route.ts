import { NextResponse } from "next/server"

import { handleTemplatesRouteError } from "@/lib/api/templates-route"
import { listAssets } from "@/lib/services/assets/list-assets"
import { uploadAsset } from "@/lib/services/assets/upload-asset"

export async function GET() {
  try {
    const data = await listAssets()
    return NextResponse.json({ data })
  } catch (error) {
    return handleTemplatesRouteError(error)
  }
}

/** multipart/form-data with a single `file` field (PNG or JPEG). */
export async function POST(request: Request) {
  let formData: FormData

  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
  }

  const file = formData.get("file")

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Choose an image to upload" }, { status: 400 })
  }

  try {
    const data = await uploadAsset(file)
    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    return handleTemplatesRouteError(error)
  }
}
