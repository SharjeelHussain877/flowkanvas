import { NextResponse } from "next/server"

import { handleTemplatesRouteError } from "@/lib/api/templates-route"
import { listFonts } from "@/lib/services/fonts/list-fonts"
import { uploadFont } from "@/lib/services/fonts/upload-font"

export async function GET() {
  try {
    const data = await listFonts()
    return NextResponse.json({ data })
  } catch (error) {
    return handleTemplatesRouteError(error)
  }
}

/** multipart/form-data with a single `file` field (.ttf / .otf). */
export async function POST(request: Request) {
  let formData: FormData

  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
  }

  const file = formData.get("file")

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Choose a font file to upload" }, { status: 400 })
  }

  try {
    const data = await uploadFont(file)
    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    return handleTemplatesRouteError(error)
  }
}
