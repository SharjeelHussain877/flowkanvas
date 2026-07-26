import { API_KEY_MASK_ASTERISKS } from "@/lib/api-keys/constants"

export function maskApiKey(keyPrefix: string): string {
  return `${keyPrefix}${"*".repeat(API_KEY_MASK_ASTERISKS)}`
}
