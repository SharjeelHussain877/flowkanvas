import { randomBytes } from "node:crypto"

import {
  API_KEY_PREFIX,
  API_KEY_RANDOM_LENGTH,
  API_KEY_VISIBLE_PREFIX_LENGTH,
} from "@/lib/api-keys/constants"

export type GeneratedApiKey = {
  secret: string
  keyPrefix: string
}

export function generateApiKey(): GeneratedApiKey {
  const randomPart = randomBytes(API_KEY_RANDOM_LENGTH / 2).toString("hex")
  const secret = `${API_KEY_PREFIX}${randomPart}`
  const keyPrefix = `${API_KEY_PREFIX}${randomPart.slice(
    0,
    API_KEY_VISIBLE_PREFIX_LENGTH
  )}`

  return { secret, keyPrefix }
}
