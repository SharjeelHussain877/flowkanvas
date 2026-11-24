import { createClient } from "@/lib/supabase/server"
import { TemplateServiceError } from "@/lib/services/templates/errors"

export async function requireAuthenticatedUserId(): Promise<string> {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new TemplateServiceError("Unauthorized", 401, "UNAUTHORIZED")
  }

  return user.id
}
