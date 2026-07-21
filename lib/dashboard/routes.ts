export const dashboardRoutes = {
  home: "/dashboard",
  requests: "/dashboard/requests",
  projects: "/dashboard/projects",
  template: (slug: string) => `/dashboard/templates/${slug}`,
  settings: {
    general: "/dashboard/settings",
    profile: "/dashboard/settings/profile",
    security: "/dashboard/settings/security",
    apiKey: "/dashboard/settings/api-key",
  },
} as const

/** Top-level sidebar nav links - no page back arrow on these routes. */
export const dashboardDirectSidebarRoutes = [
  dashboardRoutes.requests,
  dashboardRoutes.projects,
] as const

export const dashboardSettingsNav = [
  {
    title: "General",
    href: dashboardRoutes.settings.general,
    description: "Workspace name, timezone, and defaults",
  },
  {
    title: "Profile",
    href: dashboardRoutes.settings.profile,
    description: "Your name, email, and avatar",
  },
  {
    title: "Security",
    href: dashboardRoutes.settings.security,
    description: "Password and session controls",
  },
  {
    title: "API Key",
    href: dashboardRoutes.settings.apiKey,
    description: "Generate and manage API keys",
  },
] as const
