import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env"
import { getSupabaseForwardHeaders } from "@/lib/supabase/request-headers"
import type { Database } from "@/types/supabase"

type CreateClientOptions = {
  requestHeaders?: Headers
}

export async function createClient(options?: CreateClientOptions) {
  const cookieStore = await cookies()
  const forwardHeaders = options?.requestHeaders
    ? getSupabaseForwardHeaders(options.requestHeaders)
    : {}

  return createServerClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    global: {
      headers: forwardHeaders,
    },
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // setAll can fail in Server Components; safe to ignore when read-only.
        }
      },
    },
  })
}
