import { handleAuthRouteError } from "@/lib/api/auth-route"
import { updateProfileSchema } from "@/schemas/settings/update-profile"
import { updateProfile } from "@/lib/services/settings/update-profile"

function parseAvatarFile(formData: FormData): File | null {
  const avatar = formData.get("avatar")

  if (!(avatar instanceof File) || avatar.size === 0) {
    return null
  }

  return avatar
}

export async function PATCH(request: Request) {
  const contentType = request.headers.get("content-type") ?? ""

  if (contentType.includes("multipart/form-data")) {
    let formData: FormData

    try {
      formData = await request.formData()
    } catch {
      return Response.json({ error: "Invalid form data" }, { status: 400 })
    }

    const parsed = updateProfileSchema.safeParse({
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      email: formData.get("email"),
    })

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    try {
      const data = await updateProfile(parsed.data, parseAvatarFile(formData))
      return Response.json({ data })
    } catch (error) {
      return handleAuthRouteError(error)
    }
  }

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = updateProfileSchema.safeParse(body)

  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  try {
    const data = await updateProfile(parsed.data)
    return Response.json({ data })
  } catch (error) {
    return handleAuthRouteError(error)
  }
}
