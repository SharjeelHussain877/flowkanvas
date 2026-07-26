export type PublicApiKey = {
  id: string
  name: string
  key_prefix: string
  masked_key: string
  revoked: boolean
  created_at: string
  last_used_at: string | null
}

export type ApiKeysListResponse = {
  data: PublicApiKey[]
}

export type CreateApiKeyResponse = {
  key: PublicApiKey
  secret: string
}

export type CreateApiKeyApiResponse = {
  data: CreateApiKeyResponse
}

export type RevokeApiKeyApiResponse = {
  data: PublicApiKey
}
