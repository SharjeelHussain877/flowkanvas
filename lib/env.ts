import { authConfirmPath, defaultAuthenticatedPath } from "@/lib/auth/routes"

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export function getSupabaseUrl(): string {
  return requireEnv("SUPABASE_URL")
}

export function getSupabaseAnonKey(): string {
  return requireEnv("SUPABASE_PUBLISHABLE_KEY")
}

export function getSupabaseServiceRoleKey(): string {
  return requireEnv("SUPABASE_SECRET_KEY")
}

export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim()

  if (!configured) {
    throw new Error("Missing required environment variable: NEXT_PUBLIC_SITE_URL")
  }

  return configured.replace(/\/$/, "")
}

export function getEmailVerifyRedirectPath(): string {
  const configured = process.env.NEXT_PUBLIC_EMAIL_VERIFY_REDIRECT?.trim()
  if (configured?.startsWith("/")) {
    return configured
  }
  return defaultAuthenticatedPath
}

/** Email verify callback - add `${getSiteUrl()}${authConfirmPath}` to Supabase Redirect URLs. */
export function getEmailVerificationCallbackUrl(): string {
  return getAuthConfirmUrl(getEmailVerifyRedirectPath())
}

export function getAuthConfirmUrl(next: string): string {
  const params = new URLSearchParams({ next })
  return `${getSiteUrl()}${authConfirmPath}?${params.toString()}`
}

export function buildSitePath(path: string): string {
  if (!path.startsWith("/")) {
    return getSiteUrl()
  }

  return `${getSiteUrl()}${path}`
}

export function getPasswordRecoveryConfirmUrl(): string {
  return getAuthConfirmUrl("/change-password")
}
