import { redirect } from "next/navigation"

import { dashboardRoutes } from "@/lib/dashboard/routes"

export default function LegacySettingsSecurityPage() {
  redirect(dashboardRoutes.settings.general)
}
