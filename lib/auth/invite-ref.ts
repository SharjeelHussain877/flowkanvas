const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export type InviteRef = string

export function parseInviteRef(value: string | undefined): InviteRef | null {
  const trimmed = value?.trim()
  if (!trimmed || !UUID_PATTERN.test(trimmed)) {
    return null
  }

  return trimmed
}

export function getInviteRefFromSearchParam(
  ref: string | string[] | undefined
): InviteRef | undefined {
  const value = typeof ref === "string" ? ref : ref?.[0]
  const parsed = parseInviteRef(value)
  return parsed ?? undefined
}
