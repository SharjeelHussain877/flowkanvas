import { DashboardPage } from "@/components/dashboard/dashboard-page"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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

export default function SettingsProfilePage() {
  return (
    <DashboardPage
      title="Profile"
      description="Manage your personal account details."
    >
      <Card>
        <CardHeader>
          <CardTitle>Personal information</CardTitle>
          <CardDescription>
            Static profile form - authentication wiring comes later.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="size-14">
              <AvatarFallback className="bg-brand-teal/15 text-brand-teal">
                CF
              </AvatarFallback>
            </Avatar>
            <Button variant="outline" disabled>
              Upload photo
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="first-name">First name</Label>
              <Input id="first-name" defaultValue="Canvas" readOnly />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="last-name">Last name</Label>
              <Input id="last-name" defaultValue="Flow" readOnly />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              defaultValue="builder@canvasflow.app"
              readOnly
            />
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button disabled>Update profile</Button>
        </CardFooter>
      </Card>
    </DashboardPage>
  )
}
