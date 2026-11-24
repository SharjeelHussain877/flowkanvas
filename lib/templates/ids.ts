export function createElementId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().slice(0, 8)
  }

  return Math.random().toString(36).slice(2, 10)
}

export function createPageId(): string {
  return `page-${createElementId()}`
}

export function createGroupId(): string {
  return `group-${createElementId()}`
}
