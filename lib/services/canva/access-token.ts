import { refreshCanvaAccessToken, revokeCanvaToken } from "@/lib/canva/token"
import {
  deleteCanvaConnection,
  getCanvaConnectionTokens,
  updateCanvaTokens,
} from "@/lib/services/canva/connection"
import { CanvaServiceError } from "@/lib/services/canva/errors"
import { requireAuthenticatedUserId } from "@/lib/services/canva/require-user"
import { logSecurityEvent } from "@/lib/security/audit-log"

export async function disconnectCanvaConnection() {
  const userId = await requireAuthenticatedUserId()

  try {
    const connection = await getCanvaConnectionTokens(userId)

    if (connection?.refresh_token) {
      try {
        await revokeCanvaToken(connection.refresh_token)
      } catch {
        // Still remove the local connection if Canva revoke fails.
      }
    }

    await deleteCanvaConnection(userId)
    logSecurityEvent({
      event: "canva.disconnect.success",
      userId,
    })
  } catch (error) {
    logSecurityEvent({
      event: "canva.disconnect.failure",
      userId,
      message: error instanceof Error ? error.message : "disconnect failed",
    })
    throw error
  }
}

export async function getValidCanvaAccessToken(userId: string): Promise<string> {
  const connection = await getCanvaConnectionTokens(userId)

  if (!connection) {
    throw new CanvaServiceError("Canva is not connected", 404, "NOT_CONNECTED")
  }

  const expiresAt = new Date(connection.expires_at).getTime()
  const refreshBufferMs = 60 * 1000

  if (Date.now() < expiresAt - refreshBufferMs) {
    return connection.access_token
  }

  try {
    const refreshed = await refreshCanvaAccessToken(connection.refresh_token)
    await updateCanvaTokens(userId, refreshed)
    return refreshed.access_token
  } catch (error) {
    logSecurityEvent({
      event: "canva.token.refresh.failure",
      userId,
      message: error instanceof Error ? error.message : "refresh failed",
    })
    throw error
  }
}
