import { notFound } from "next/navigation"

import { DashboardPage } from "@/components/dashboard/dashboard-page"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  recentDraftTemplates,
  savedProjectTemplates,
} from "@/lib/dashboard/mock-data"

type TemplatePageProps = {
  params: Promise<{ slug: string }>
}

function findTemplate(slug: string) {
  return (
    savedProjectTemplates.find((item) => item.slug === slug) ??
    recentDraftTemplates.find((item) => item.slug === slug)
  )
}

export default async function TemplatePage({ params }: TemplatePageProps) {
  const { slug } = await params
  const template = findTemplate(slug)

  if (!template) {
    notFound()
  }

  const isDraft = recentDraftTemplates.some((item) => item.slug === slug)

  return (
    <DashboardPage
      title={template.title}
      description={`Static template workspace preview - ${isDraft ? "draft" : "saved"} template.`}
      action={
        <Badge variant={isDraft ? "secondary" : "default"}>
          {isDraft ? "Draft" : "Saved"}
        </Badge>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Canvas preview</CardTitle>
            <CardDescription>
              Placeholder editor area for blocks, variables, and styling.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex min-h-80 items-center justify-center rounded-xl border border-dashed border-border bg-brand-surface text-sm text-muted-foreground">
              Template canvas for {template.title}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
            <CardDescription>Metadata shown in sidebar lists.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Slug</span>
              <span className="font-medium">{template.slug}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Last updated</span>
              <span className="font-medium">{template.updatedAt}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Type</span>
              <span className="font-medium">
                {isDraft ? "Recent draft" : "Saved project"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardPage>
  )
}
