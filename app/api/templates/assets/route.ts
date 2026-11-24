import { NextResponse } from "next/server"

import { handleTemplatesRouteError } from "@/lib/api/templates-route"
import { uploadTemplateAsset } from "@/lib/services/templates/upload-template-asset"

export async function POST(request: Request) {
  let formData: FormData

  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
  }

  const file = formData.get("file")
  const templateId = formData.get("templateId")

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Choose an image to upload" }, { status: 400 })
  }

  try {
    const data = await uploadTemplateAsset(
      file,
      typeof templateId === "string" && templateId ? templateId : null
    )
    return NextResponse.json({ data })
  } catch (error) {
    return handleTemplatesRouteError(error)
  }
}
