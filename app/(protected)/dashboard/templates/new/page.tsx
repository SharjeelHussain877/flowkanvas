import { NewTemplateForm } from "@/app/(protected)/dashboard/templates/new/_components/new-template-form"
import { DashboardPage } from "@/components/dashboard/dashboard-page"

export default function NewTemplatePage() {
  return (
    <DashboardPage
      title="New Template"
      description="Start from a ready-made design or a blank page of any size, then make it yours in the editor."
    >
      <NewTemplateForm />
    </DashboardPage>
  )
}
