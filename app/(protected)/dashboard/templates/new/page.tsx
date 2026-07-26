import { DashboardPage } from "@/components/dashboard/dashboard-page"
import { Badge } from "@/components/ui/badge"
import { TemplateWorkspace } from "../_components/template-workspace"

const newTemplate = {
  slug: "",
  title: "Untitled Template",
  updatedAt: "",
  status: "draft" as const,
}

export default function NewTemplatePage() {
  return (
    <DashboardPage
      title="New Template"
      description="Create a new draft template in your workspace."
      action={<Badge variant="secondary">Draft</Badge>}
    >
      <TemplateWorkspace template={newTemplate} isNew />
    </DashboardPage>
  )
}
