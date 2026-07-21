export const AUTH_NOTICES = {
  confirm_email: "Please check your email to confirm your account.",
} as const

export type AuthNoticeCode = keyof typeof AUTH_NOTICES

export function getAuthNoticeMessage(
  code: string | undefined
): string | null {
  if (!code) {
    return null
  }

  if (code in AUTH_NOTICES) {
    return AUTH_NOTICES[code as AuthNoticeCode]
  }

  return null
}
