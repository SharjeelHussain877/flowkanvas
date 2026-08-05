type SecurityEventName =
  | "canva.connect.success"
  | "canva.connect.failure"
  | "canva.disconnect.success"
  | "canva.disconnect.failure"
  | "canva.token.refresh.failure"
  | "canva.rate_limit.exceeded"

type SecurityEvent = {
  event: SecurityEventName
  userId?: string | null
  ip?: string | null
  code?: string | null
  message?: string | null
}

/**
 * Structured security log - never include client secrets or OAuth tokens.
 */
export function logSecurityEvent(entry: SecurityEvent) {
  const payload = {
    ts: new Date().toISOString(),
    ...entry,
  }

  console.info("[security]", JSON.stringify(payload))
}
