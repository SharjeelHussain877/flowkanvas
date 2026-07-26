export const dashboardRoutes = {
  home: "/dashboard",
  requests: "/dashboard/requests",
  templates: "/dashboard/templates",
  templateNew: "/dashboard/templates/new",
  template: (slug: string) => `/dashboard/templates/${slug}`,
  settings: {
    general: "/dashboard/settings",
    apiKeys: "/dashboard/settings/api-keys",
  },
} as const

/** Top-level sidebar nav links - no page back arrow on these routes. */
export const dashboardDirectSidebarRoutes = [
  dashboardRoutes.requests,
  dashboardRoutes.templates,
] as const

export const dashboardSettingsNav = [
  {
    title: "Settings",
    href: dashboardRoutes.settings.general,
    description: "Profile and security",
  },
  {
    title: "API Keys",
    href: dashboardRoutes.settings.apiKeys,
    description: "Generate and manage API keys",
  },
] as const
