export const queryKeys = {
  auth: {
    all: ["auth"] as const,
    recoverySession: () =>
      [...queryKeys.auth.all, "recovery-session"] as const,
  },
  apiKeys: {
    all: ["api-keys"] as const,
    list: () => [...queryKeys.apiKeys.all, "list"] as const,
  },
  sessions: {
    all: ["sessions"] as const,
    list: () => [...queryKeys.sessions.all, "list"] as const,
  },
} as const
