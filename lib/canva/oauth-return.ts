import { dashboardRoutes } from "@/lib/dashboard/routes"

export function getCanvaOAuthReturnTo(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return dashboardRoutes.settings.general
  }

  return value
}
