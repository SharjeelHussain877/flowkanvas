import { CanvaServiceError } from "@/lib/services/canva/errors"
import { logSecurityEvent } from "@/lib/security/audit-log"

type RateLimitBucket = {
  count: number
  resetAt: number
}

const buckets = new Map<string, RateLimitBucket>()

type RateLimitOptions = {
  key: string
  limit: number
  windowMs: number
  userId?: string
}

export function assertRateLimit({
  key,
  limit,
  windowMs,
  userId,
}: RateLimitOptions) {
  const now = Date.now()
  const existing = buckets.get(key)

  if (!existing || now >= existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return
  }

  if (existing.count >= limit) {
    logSecurityEvent({
      event: "canva.rate_limit.exceeded",
      userId: userId ?? null,
      code: "RATE_LIMITED",
      message: `Limit ${limit} per ${windowMs}ms`,
    })
    throw new CanvaServiceError(
      "Too many Canva requests. Please wait a moment and try again.",
      429,
      "RATE_LIMITED"
    )
  }

  existing.count += 1
}

/** Best-effort cleanup so long-running processes don't grow unbounded. */
export function pruneRateLimitBuckets() {
  const now = Date.now()
  for (const [key, bucket] of buckets) {
    if (now >= bucket.resetAt) {
      buckets.delete(key)
    }
  }
}
