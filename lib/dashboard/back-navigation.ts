import {
  dashboardDirectSidebarRoutes,
  dashboardRoutes,
} from "@/lib/dashboard/routes"

export type DashboardBackNavigation = {
  href: string
  label: string
}

export function getDashboardBackNavigation(
  pathname: string
): DashboardBackNavigation | null {
  if (
    dashboardDirectSidebarRoutes.includes(
      pathname as (typeof dashboardDirectSidebarRoutes)[number]
    )
  ) {
    return null
  }

  if (
    pathname.startsWith("/dashboard/templates/") &&
    pathname !== dashboardRoutes.templateNew
  ) {
    return { href: dashboardRoutes.templates, label: "Templates" }
  }

  if (pathname === dashboardRoutes.templateNew) {
    return { href: dashboardRoutes.templates, label: "Templates" }
  }

  if (pathname === dashboardRoutes.settings.general) {
    return { href: dashboardRoutes.requests, label: "Requests" }
  }

  if (pathname.startsWith("/dashboard/settings/")) {
    return { href: dashboardRoutes.settings.general, label: "Settings" }
  }

  return null
}
