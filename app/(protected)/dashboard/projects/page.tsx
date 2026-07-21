import { LayoutTemplate } from "lucide-react"

import { DashboardPage } from "@/components/dashboard/dashboard-page"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { savedProjectTemplates } from "@/lib/dashboard/mock-data"
import { dashboardRoutes } from "@/lib/dashboard/routes"
import Link from "next/link"

export default function ProjectsPage() {
  return (
    <DashboardPage
      title="Projects"
      description="All saved templates in your workspace."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {savedProjectTemplates.map((template) => (
          <Link
            key={template.slug}
            href={dashboardRoutes.template(template.slug)}
            className="group"
          >
            <Card className="h-full transition-colors hover:border-brand-teal/40">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-brand-teal/10 text-brand-teal">
                    <LayoutTemplate className="size-5" />
                  </div>
                  <Badge variant="secondary">Saved</Badge>
                </div>
                <CardTitle className="group-hover:text-brand-teal">
                  {template.title}
                </CardTitle>
                <CardDescription>Updated {template.updatedAt}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Open template editor and payload preview.
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </DashboardPage>
  )
}
