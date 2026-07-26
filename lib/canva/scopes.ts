/** Scopes enabled in Canva Developer Portal (Reading and writing section). */
export const CANVA_TEMPLATE_SCOPES = [
  "profile:read",
  "app:read",
  "app:write",
  "asset:read",
  "asset:write",
  "brandtemplate:content:read",
  "brandtemplate:content:write",
  "design:meta:read",
  "design:content:read",
  "design:content:write",
  "design:permission:read",
  "design:permission:write",
  "folder:read",
  "folder:write",
  "folder:permission:read",
  "folder:permission:write",
] as const

export const CANVA_TEMPLATE_SCOPES_STRING = CANVA_TEMPLATE_SCOPES.join(" ")

export function formatCanvaScopeMismatchMessage(message: string): string {
  if (!message.toLowerCase().includes("scope")) {
    return message
  }

  return `${message} Enable the same scopes in Canva Developer Portal → your integration → Scopes, then set CANVA_SCOPES in .env to match exactly.`
}
