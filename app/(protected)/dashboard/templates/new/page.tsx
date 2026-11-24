import { NewTemplateForm } from "@/app/(protected)/dashboard/templates/new/_components/new-template-form"
import { DashboardPage } from "@/components/dashboard/dashboard-page"

export default function NewTemplatePage() {
  return (
    <DashboardPage
      title="New Template"
      description="Pick a page size - any size works - then design it on the canvas."
    >
      <NewTemplateForm />
    </DashboardPage>
  )
}
