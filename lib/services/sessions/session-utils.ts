export type AuthSessionRow = {
  id: string
  created_at: string
  updated_at: string
  refreshed_at: string | null
  user_agent: string | null
  ip: string | null
}

export type UserSession = {
  id: string
  deviceLabel: string
  browserLabel: string
  ipAddress: string | null
  lastActiveAt: string
  isCurrent: boolean
  sessionCount: number
  revokeSessionIds: string[]
}

export type SessionsPayload = {
  sessions: UserSession[]
  currentSessionId: string | null
}

export function getSessionIdFromAccessToken(accessToken: string): string | null {
  try {
    const payloadSegment = accessToken.split(".")[1]
    if (!payloadSegment) {
      return null
    }

    const payload = JSON.parse(
      Buffer.from(payloadSegment, "base64url").toString("utf8")
    ) as { session_id?: unknown }

    return typeof payload.session_id === "string" ? payload.session_id : null
  } catch {
    return null
  }
}

function detectBrowser(userAgent: string): string {
  if (/edg\//i.test(userAgent)) {
    return "Edge"
  }

  if (/opr\//i.test(userAgent) || /opera/i.test(userAgent)) {
    return "Opera"
  }

  if (/firefox\//i.test(userAgent)) {
    return "Firefox"
  }

  if (/crios\//i.test(userAgent)) {
    return "Chrome"
  }

  if (/chrome\//i.test(userAgent) && !/edg\//i.test(userAgent)) {
    return "Chrome"
  }

  if (/safari\//i.test(userAgent) && !/chrome\//i.test(userAgent)) {
    return "Safari"
  }

  if (/node\.js|undici|next\.js/i.test(userAgent)) {
    return "Server"
  }

  return "Browser"
}

function detectDevice(userAgent: string): string {
  if (/ipad/i.test(userAgent)) {
    return "iPad"
  }

  if (/iphone/i.test(userAgent)) {
    return "iPhone"
  }

  if (/android/i.test(userAgent)) {
    return "Android"
  }

  if (/mac os x|macintosh/i.test(userAgent)) {
    return "macOS"
  }

  if (/windows nt|win64|win32/i.test(userAgent)) {
    return "Windows"
  }

  if (/cros/i.test(userAgent)) {
    return "ChromeOS"
  }

  if (/linux/i.test(userAgent)) {
    return "Linux"
  }

  if (/node\.js|undici|next\.js/i.test(userAgent)) {
    return "Server"
  }

  return "Device"
}

export function parseDeviceLabels(userAgent: string | null): {
  deviceLabel: string
  browserLabel: string
} {
  const trimmed = userAgent?.trim()
  if (!trimmed) {
    return { deviceLabel: "Web device", browserLabel: "Browser" }
  }

  return {
    deviceLabel: detectDevice(trimmed),
    browserLabel: detectBrowser(trimmed),
  }
}

export function formatSessionLastActive(
  refreshedAt: string | null,
  updatedAt: string,
  createdAt: string
): string {
  const timestamp = refreshedAt ?? updatedAt ?? createdAt
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp))
}

function getSessionDeviceKey(row: AuthSessionRow): string {
  const { deviceLabel, browserLabel } = parseDeviceLabels(row.user_agent)
  const ipAddress = row.ip?.trim() ?? ""

  return `${deviceLabel}|${browserLabel}|${ipAddress}`
}

function getSessionTimestamp(row: AuthSessionRow): number {
  return new Date(
    row.refreshed_at ?? row.updated_at ?? row.created_at
  ).getTime()
}

export function mapAuthSessionRows(
  rows: AuthSessionRow[],
  currentSessionId: string | null
): UserSession[] {
  const grouped = new Map<string, AuthSessionRow[]>()

  for (const row of rows) {
    const key = getSessionDeviceKey(row)
    const group = grouped.get(key)

    if (group) {
      group.push(row)
    } else {
      grouped.set(key, [row])
    }
  }

  const sessions: Array<{ session: UserSession; sortTime: number }> = []

  for (const groupRows of grouped.values()) {
    const sorted = [...groupRows].sort(
      (left, right) => getSessionTimestamp(right) - getSessionTimestamp(left)
    )
    const representative =
      sorted.find((row) => row.id === currentSessionId) ?? sorted[0]
    const { deviceLabel, browserLabel } = parseDeviceLabels(representative.user_agent)
    const isCurrent =
      currentSessionId !== null &&
      sorted.some((row) => row.id === currentSessionId)
    const revokeSessionIds = sorted
      .filter((row) => row.id !== currentSessionId)
      .map((row) => row.id)

    sessions.push({
      sortTime: getSessionTimestamp(representative),
      session: {
        id: representative.id,
        deviceLabel,
        browserLabel,
        ipAddress: representative.ip,
        lastActiveAt: formatSessionLastActive(
          representative.refreshed_at,
          representative.updated_at,
          representative.created_at
        ),
        isCurrent,
        sessionCount: sorted.length,
        revokeSessionIds,
      },
    })
  }

  return sessions
    .sort((left, right) => right.sortTime - left.sortTime)
    .map(({ session }) => session)
}
