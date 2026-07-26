export function buildProfileMetadata(params: {
  firstName: string
  lastName: string
  avatarUrl: string | null
}): Record<string, string> {
  const firstName = params.firstName.trim()
  const lastName = params.lastName.trim()
  const fullName = `${firstName} ${lastName}`.trim()

  const metadata: Record<string, string> = {
    first_name: firstName,
    last_name: lastName,
    full_name: fullName,
    name: fullName,
  }

  if (params.avatarUrl) {
    metadata.avatar_url = params.avatarUrl
    metadata.avatarUrl = params.avatarUrl
    metadata.picture = params.avatarUrl
  }

  return metadata
}
