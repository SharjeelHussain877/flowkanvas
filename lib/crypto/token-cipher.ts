import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"

import { getCanvaTokenEncryptionKey } from "@/lib/env"

const PREFIX = "enc.v1."
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16

export type TokenCipherPurpose = "access_token" | "refresh_token"

function getKey(): Buffer {
  const raw = getCanvaTokenEncryptionKey()
  const key = Buffer.from(raw, "hex")

  if (key.length !== 32) {
    throw new Error(
      "CANVA_TOKEN_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)"
    )
  }

  return key
}

/** Encrypt a Canva token. Access and refresh use separate AAD purposes. */
export function encryptToken(
  plaintext: string,
  purpose: TokenCipherPurpose
): string {
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv)
  cipher.setAAD(Buffer.from(purpose, "utf8"))

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ])
  const tag = cipher.getAuthTag()

  return (
    PREFIX +
    Buffer.concat([iv, tag, encrypted]).toString("base64url")
  )
}

/**
 * Decrypt a stored token. Legacy plaintext values (no prefix) are returned as-is
 * so existing rows keep working until the next token refresh/save.
 */
export function decryptToken(
  stored: string,
  purpose: TokenCipherPurpose
): string {
  if (!stored.startsWith(PREFIX)) {
    return stored
  }

  const payload = Buffer.from(stored.slice(PREFIX.length), "base64url")
  const iv = payload.subarray(0, IV_LENGTH)
  const tag = payload.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
  const encrypted = payload.subarray(IV_LENGTH + AUTH_TAG_LENGTH)

  const decipher = createDecipheriv("aes-256-gcm", getKey(), iv)
  decipher.setAAD(Buffer.from(purpose, "utf8"))
  decipher.setAuthTag(tag)

  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]).toString("utf8")
}

export function isEncryptedToken(stored: string): boolean {
  return stored.startsWith(PREFIX)
}
