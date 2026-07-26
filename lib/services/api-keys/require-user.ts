import { createClient } from "@/lib/supabase/server"
import { ApiKeyServiceError } from "@/lib/services/api-keys/errors"

export async function requireAuthenticatedUserId(): Promise<string> {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new ApiKeyServiceError("Unauthorized", 401, "UNAUTHORIZED")
  }

  return user.id
}
