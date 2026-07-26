import { z } from "zod"

export const userSessionSchema = z.object({
  id: z.string().uuid(),
  deviceLabel: z.string(),
  browserLabel: z.string(),
  ipAddress: z.string().nullable(),
  lastActiveAt: z.string(),
  isCurrent: z.boolean(),
  sessionCount: z.number().int().min(1),
  revokeSessionIds: z.array(z.string().uuid()),
})

export type UserSession = z.infer<typeof userSessionSchema>

export type SessionsListResponse = {
  data: {
    sessions: UserSession[]
    currentSessionId: string | null
  }
}

export type RevokeSessionResponse = {
  data: {
    success: true
    revokedCurrentSession: boolean
  }
}

export type RevokeOtherSessionsResponse = {
  data: {
    success: true
  }
}
