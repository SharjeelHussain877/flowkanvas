import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { DashboardTemplate } from "@/lib/dashboard/mock-data"

type TemplateWorkspaceProps = {
  template: Pick<DashboardTemplate, "slug" | "title" | "updatedAt" | "status">
  isNew?: boolean
}

export function TemplateWorkspace({ template, isNew = false }: TemplateWorkspaceProps) {
  const isDraft = template.status === "draft"

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Card>
        <CardHeader>
          <CardTitle>Canvas preview</CardTitle>
          <CardDescription>
            {isNew
              ? "Start building blocks, variables, and styling for your template."
              : "Placeholder editor area for blocks, variables, and styling."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex min-h-80 items-center justify-center rounded-xl border border-dashed border-border bg-brand-surface text-sm text-muted-foreground">
            {isNew
              ? "Empty template canvas - add your first block to get started."
              : `Template canvas for ${template.title}`}
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
            <span className="font-medium">{isNew ? "-" : template.slug}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Last updated</span>
            <span className="font-medium">
              {isNew ? "Not saved yet" : template.updatedAt}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Status</span>
            <span className="font-medium capitalize">{template.status}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Type</span>
            <span className="font-medium">
              {isDraft ? "Draft template" : "Saved template"}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
