import type { User } from "@supabase/supabase-js"

export type ProfileData = {
  firstName: string
  lastName: string
  email: string
  initials: string
  avatarUrl: string | null
  inviteCount: number
}

export function getInitials(
  firstName: string,
  lastName: string,
  email: string
): string {
  if (firstName || lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "FK"
  }

  return email.slice(0, 2).toUpperCase() || "FK"
}

export function parseProfileFromUser(
  user: User | null,
  inviteCount = 0
): ProfileData {
  const metadata = (user?.user_metadata ?? {}) as Record<string, unknown>
  let firstName =
    typeof metadata.first_name === "string" ? metadata.first_name : ""
  let lastName =
    typeof metadata.last_name === "string" ? metadata.last_name : ""

  if (!firstName && !lastName && typeof metadata.full_name === "string") {
    const parts = metadata.full_name.trim().split(/\s+/).filter(Boolean)
    firstName = parts[0] ?? ""
    lastName = parts.slice(1).join(" ")
  }

  const email = user?.email ?? ""
  const avatarUrl =
    typeof metadata.avatar_url === "string" && metadata.avatar_url.length > 0
      ? metadata.avatar_url
      : typeof metadata.avatarUrl === "string" && metadata.avatarUrl.length > 0
        ? metadata.avatarUrl
        : typeof metadata.picture === "string" && metadata.picture.length > 0
          ? metadata.picture
          : null

  return {
    firstName,
    lastName,
    email,
    initials: getInitials(firstName, lastName, email),
    avatarUrl,
    inviteCount,
  }
}
