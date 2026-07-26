export const ALLOWED_AVATAR_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const

export const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024

export type UploadAvatarResponse = {
  success: true
  message: string
  profile: {
    avatarUrl: string
  }
}
