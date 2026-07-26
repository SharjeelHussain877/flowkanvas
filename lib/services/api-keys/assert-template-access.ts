import { TemplateAccessError } from "@/lib/services/api-keys/errors"

export function assertTemplateAccess(
  templateUserId: string,
  apiKeyUserId: string
): void {
  if (templateUserId !== apiKeyUserId) {
    throw new TemplateAccessError()
  }
}
