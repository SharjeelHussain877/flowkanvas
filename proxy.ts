import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"

import { PASSWORD_RECOVERY_COOKIE } from "@/lib/auth/password-recovery-cookie"
import {
  defaultAuthenticatedPath,
  defaultUnauthenticatedPath,
  isAuthRoute,
  isProtectedRoute,
} from "@/lib/auth/routes"
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env"

const AUTH_LOOKUP_TIMEOUT_MS =
  process.env.NODE_ENV === "development" ? 2_000 : 8_000

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

  const isPasswordRecovery =
    request.cookies.get(PASSWORD_RECOVERY_COOKIE)?.value === "1"

  // Recovery sessions may only stay on the change-password screen (pages only).
  if (
    isPasswordRecovery &&
    !isChangePasswordRoute &&
    !pathname.startsWith("/api/")
  ) {
    const changePasswordUrl = request.nextUrl.clone()
    changePasswordUrl.pathname = "/change-password"
    changePasswordUrl.search = ""
    changePasswordUrl.hash = ""
    return NextResponse.redirect(changePasswordUrl)
  }

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
