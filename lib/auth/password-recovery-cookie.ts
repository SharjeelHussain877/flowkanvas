export const PASSWORD_RECOVERY_COOKIE = "flowkanvas_password_recovery"

export const passwordRecoveryCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60, // 1 hour - recovery links expire sooner anyway
}
