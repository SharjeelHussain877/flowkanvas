export function getSupabaseForwardHeaders(
  requestHeaders: Headers
): Record<string, string> {
  const headers: Record<string, string> = {}
  const userAgent = requestHeaders.get("user-agent")?.trim()
  const forwardedFor = requestHeaders
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim()
  const realIp = requestHeaders.get("x-real-ip")?.trim()

  if (userAgent) {
    headers["User-Agent"] = userAgent
  }

  const clientIp = forwardedFor || realIp
  if (clientIp) {
    headers["X-Forwarded-For"] = clientIp
  }

  return headers
}
