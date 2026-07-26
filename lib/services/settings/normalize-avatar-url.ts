export function normalizeAvatarUrlForMetadata(
  avatarUrl: string | null
): string | null {
  if (!avatarUrl) {
    return null
  }

  const trimmed = avatarUrl.trim()
  if (!trimmed) {
    return null
  }

  return trimmed.split("?")[0] ?? trimmed
}
