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
  templates: {
    all: ["templates"] as const,
    list: () => [...queryKeys.templates.all, "list"] as const,
    detail: (id: string) => [...queryKeys.templates.all, "detail", id] as const,
  },
  requests: {
    all: ["requests"] as const,
    list: () => [...queryKeys.requests.all, "list"] as const,
  },
  fonts: {
    all: ["fonts"] as const,
    list: () => [...queryKeys.fonts.all, "list"] as const,
  },
  assets: {
    all: ["assets"] as const,
    list: () => [...queryKeys.assets.all, "list"] as const,
  },
} as const
