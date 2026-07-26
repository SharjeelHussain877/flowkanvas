import { LayoutTemplate, Plus } from "lucide-react"
import Link from "next/link"

import { authPrimaryButtonClassName } from "@/app/(auth)/_components/auth-submit-button"
import { DashboardPage } from "@/components/dashboard/dashboard-page"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { savedTemplates } from "@/lib/dashboard/mock-data"
import { dashboardRoutes } from "@/lib/dashboard/routes"
import { cn } from "@/lib/utils"

export default function TemplatesPage() {
  return (
    <DashboardPage
      title="Templates"
      description="All saved templates in your workspace."
      action={
        <Button asChild className={cn(authPrimaryButtonClassName, "px-4")}>
          <Link href={dashboardRoutes.templateNew}>
            Create Template
            <Plus className="size-4" aria-hidden />
          </Link>
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {savedTemplates.map((template) => (
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
                  <Badge variant="default">Saved</Badge>
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
