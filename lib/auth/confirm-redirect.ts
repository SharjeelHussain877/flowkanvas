import { defaultAuthenticatedPath } from "@/lib/auth/routes"

export function getAuthConfirmNextPath(
  type: string | null,
  nextParam: string | null
): string {
  if (nextParam) {
    return nextParam
  }

  if (type === "recovery" || type === "email_change") {
    return "/change-password"
  }

  if (type === "signup" || type === "invite" || type === "magiclink") {
    return defaultAuthenticatedPath
  }

  return "/"
}
