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
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  return "http://localhost:3000"
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

export function getPasswordRecoveryConfirmUrl(): string {
  return `${getSiteUrl()}/change-password`
}
