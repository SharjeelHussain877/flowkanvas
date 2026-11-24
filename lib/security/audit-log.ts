type SecurityEventName =
  | "api.rate_limit.exceeded"
  | "template.render.failure"
  | "template.asset.rejected"

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
