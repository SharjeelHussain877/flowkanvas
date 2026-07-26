import { parseBearerApiKey } from "@/lib/api-keys/parse-authorization-header"
import {
  authenticateApiKey,
  type AuthenticatedApiKeyContext,
} from "@/lib/services/api-keys/authenticate-api-key"
import { ApiKeyAuthError } from "@/lib/services/api-keys/errors"

export async function authenticateApiRequest(
  request: Request
): Promise<AuthenticatedApiKeyContext> {
  const secret = parseBearerApiKey(request.headers.get("authorization"))

  if (!secret) {
    throw new ApiKeyAuthError(
      "Missing or invalid Authorization header",
      401,
      "MISSING_API_KEY"
    )
  }

  return authenticateApiKey(secret)
}
