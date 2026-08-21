import { deleteCanvaConnection } from "@/lib/services/canva/connection"
import { CanvaServiceError } from "@/lib/services/canva/errors"
import { logSecurityEvent } from "@/lib/security/audit-log"

export const CANVA_TOKEN_REVOKED_CODE = "TOKEN_REVOKED"

function includesRevokedHint(value: string) {
  const normalized = value.toLowerCase()
  return (
    normalized.includes("revok") ||
    normalized.includes("invalid_grant") ||
    normalized.includes("invalid_token") ||
    normalized.includes("invalid_access_token")
  )
}

export function isCanvaTokenRevokedError(error: unknown): boolean {
  if (error instanceof CanvaServiceError) {
    if (error.code === CANVA_TOKEN_REVOKED_CODE) {
      return true
    }

    if (error.status === 401 || includesRevokedHint(error.code)) {
      return true
    }

    return includesRevokedHint(error.message)
  }

  if (error instanceof Error) {
    return includesRevokedHint(error.message)
  }

  return false
}

export async function removeRevokedCanvaConnection(userId: string) {
  await deleteCanvaConnection(userId)
  logSecurityEvent({
    event: "canva.token.revoked",
    userId,
    code: CANVA_TOKEN_REVOKED_CODE,
    message: "Revoked Canva token removed from database",
  })
}
