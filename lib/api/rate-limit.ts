import { logSecurityEvent } from "@/lib/security/audit-log"

export class RateLimitError extends Error {
  status = 429
  code = "RATE_LIMITED"

  constructor(message = "Too many requests. Please wait a moment and try again.") {
    super(message)
    this.name = "RateLimitError"
  }
}

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
      event: "api.rate_limit.exceeded",
      userId: userId ?? null,
      code: "RATE_LIMITED",
      message: `Limit ${limit} per ${windowMs}ms`,
    })
    throw new RateLimitError()
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
