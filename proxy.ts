import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"

import {
  defaultAuthenticatedPath,
  defaultUnauthenticatedPath,
  isAuthRoute,
  isProtectedRoute,
} from "@/lib/auth/routes"
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env"

const AUTH_LOOKUP_TIMEOUT_MS = 8_000

async function getAuthenticatedUser(
  supabase: ReturnType<typeof createServerClient>
) {
  try {
    const result = await Promise.race([
      supabase.auth.getUser(),
      new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), AUTH_LOOKUP_TIMEOUT_MS)
      ),
    ])

    if (result === null) {
      return null
    }

    return result.data.user
  } catch {
    return null
  }
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value)
        })
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options)
        })
      },
    },
  })

  const user = await getAuthenticatedUser(supabase)

  const { pathname } = request.nextUrl
  const isChangePasswordRoute =
    pathname === "/change-password" ||
    pathname.startsWith("/change-password/")

  if (user && isAuthRoute(pathname) && !isChangePasswordRoute) {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = defaultAuthenticatedPath
    dashboardUrl.search = ""
    return NextResponse.redirect(dashboardUrl)
  }

  if (!user && isProtectedRoute(pathname)) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = defaultUnauthenticatedPath
    loginUrl.search = ""
    return NextResponse.redirect(loginUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
