import { DashboardPage } from "@/components/dashboard/dashboard-page"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SettingsGeneralPage() {
  return (
    <DashboardPage
      title="General settings"
      description="Workspace defaults and regional preferences."
    >
      <Card>
        <CardHeader>
          <CardTitle>Workspace</CardTitle>
          <CardDescription>
            These values appear in generated PDFs and API responses.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="workspace-name">Workspace name</Label>
            <Input
              id="workspace-name"
              defaultValue="flowkanvas Studio"
              readOnly
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Input id="timezone" defaultValue="Asia/Karachi (UTC+5)" readOnly />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="default-format">Default export format</Label>
            <Input id="default-format" defaultValue="PDF/A-1b" readOnly />
          </div>
        </CardContent>
        <CardFooter className="justify-end gap-2">
          <Button variant="outline" disabled>
            Reset
          </Button>
          <Button disabled>Save changes</Button>
        </CardFooter>
      </Card>
    </DashboardPage>
  )
}
