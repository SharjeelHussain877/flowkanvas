import { API_KEY_PREFIX } from "@/lib/api-keys/constants"

export function parseBearerApiKey(
  authorizationHeader: string | null
): string | null {
  if (!authorizationHeader) {
    return null
  }

  const [scheme, token] = authorizationHeader.trim().split(/\s+/, 2)

  if (!scheme || !token || scheme.toLowerCase() !== "bearer") {
    return null
  }

  if (!token.startsWith(API_KEY_PREFIX)) {
    return null
  }

  return token
}
